import path from 'path';
import { promises as fs } from 'fs';
import lockfile from 'proper-lockfile';
import { compare as compareVersions } from 'compare-versions';

import type { Deployment } from '@openzeppelin/upgrades-core/src/deployment';
import type { StorageLayout } from '@openzeppelin/upgrades-core/src/storage';
import * as zk from 'zksync-ethers';
import { mapValues, pick } from '../utils/utils-general';
import { MANIFEST_DEFAULT_DIR } from '../constants';
import { ZkSyncUpgradablePluginError } from '../errors';
import { getChainId, networkNames } from './provider';

const currentManifestVersion = '3.2';

export interface ManifestData {
    manifestVersion: string;
    impls: {
        [version in string]?: ImplDeployment;
    };
    proxies: ProxyDeployment[];
    admin?: Deployment;
}

export interface ImplDeployment extends Deployment {
    layout: StorageLayout;
    allAddresses?: string[];
}

export interface ProxyDeployment extends Deployment {
    kind: 'uups' | 'transparent' | 'beacon';
}

export class DeploymentNotFound extends ZkSyncUpgradablePluginError {}

function defaultManifest(): ManifestData {
    return {
        manifestVersion: currentManifestVersion,
        impls: {},
        proxies: [],
    };
}

export class Manifest {
    private readonly chainId: number;
    private readonly file: string;
    private readonly dir: string;

    private readonly chainIdSuffix: string;
    private readonly parent?: Manifest;

    private locked = false;

    public static async forNetwork(provider: zk.Provider): Promise<Manifest> {
        const chainId = await getChainId(provider);
        return new Manifest(chainId);
    }

    constructor(chainId: number) {
        this.chainId = chainId;
        this.chainIdSuffix = `${chainId}`;

        this.dir = MANIFEST_DEFAULT_DIR;

        const defaultFallbackName = `unknown-network-${chainId}`;
        const networkName = networkNames[chainId] !== undefined ? networkNames[chainId] : defaultFallbackName;

        this.file = path.join(MANIFEST_DEFAULT_DIR, `${networkName}.json`);
    }

    public async getAdmin(): Promise<Deployment | undefined> {
        return (await this.read()).admin;
    }

    public async getDeploymentFromAddress(address: string): Promise<ImplDeployment> {
        const data = await this.read();
        const deployment = Object.values(data.impls).find(
            (d) => d?.address === address || d?.allAddresses?.includes(address),
        );

        if (deployment === undefined) {
            throw new DeploymentNotFound(`Deployment at address ${address} is not registered`);
        }
        return deployment;
    }

    public async getProxyFromAddress(address: string): Promise<ProxyDeployment> {
        const data = await this.read();
        const deployment = data.proxies.find((d) => d?.address === address);
        if (deployment === undefined) {
            throw new DeploymentNotFound(`Proxy at address ${address} is not registered`);
        }
        return deployment;
    }

    public async addProxy(proxy: ProxyDeployment): Promise<void> {
        await this.lockedRun(async () => {
            const data = await this.read();
            const existing = data.proxies.findIndex((p) => p.address === proxy.address);
            if (existing >= 0) {
                data.proxies.splice(existing, 1);
            }
            data.proxies.push(proxy);
            await this.write(data);
        });
    }

    private async _readFile(): Promise<string> {
        return await fs.readFile(this.file, 'utf8');
    }

    private async _writeFile(content: string): Promise<void> {
        await fs.writeFile(this.file, content);
    }

    public async read(retries?: number): Promise<ManifestData> {
        const release = this.locked ? undefined : await this._lock(retries);
        try {
            const data = JSON.parse(await this._readFile()) as ManifestData;
            return validateOrUpdateManifestVersion(data);
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                if (this.parent !== undefined) {
                    return await this.parent.read(retries);
                } else {
                    return defaultManifest();
                }
            } else {
                throw e;
            }
        } finally {
            await release?.();
        }
    }

    public async write(data: ManifestData): Promise<void> {
        if (!this.locked) {
            throw new ZkSyncUpgradablePluginError('Manifest must be locked');
        }
        const normalized = normalizeManifestData(data);
        await this._writeFile(`${JSON.stringify(normalized, null, 2)}\n`);
    }

    public async lockedRun<T>(cb: () => Promise<T>): Promise<T> {
        if (this.locked) {
            throw new ZkSyncUpgradablePluginError('Manifest is already locked');
        }
        const release = await this._lock();
        try {
            return await cb();
        } finally {
            await release();
        }
    }

    private async _lock(retries = 3) {
        const lockfileName = path.join(this.dir, `chain-${this.chainIdSuffix}`);

        await fs.mkdir(path.dirname(lockfileName), { recursive: true });
        const release = await lockfile.lock(lockfileName, { retries, realpath: false });
        this.locked = true;
        return async () => {
            await release();
            this.locked = false;
        };
    }
}

function validateOrUpdateManifestVersion(data: ManifestData): ManifestData {
    if (typeof data.manifestVersion !== 'string') {
        throw new ZkSyncUpgradablePluginError('Manifest version is missing');
    } else if (compareVersions(data.manifestVersion, '3.0', '<')) {
        throw new ZkSyncUpgradablePluginError(
            'Found a manifest file for OpenZeppelin CLI. An automated migration is not yet available.',
        );
    } else if (compareVersions(data.manifestVersion, currentManifestVersion, '<')) {
        return migrateManifest(data);
    } else if (data.manifestVersion === currentManifestVersion) {
        return data;
    } else {
        throw new ZkSyncUpgradablePluginError(`Unknown value for manifest version (${data.manifestVersion})`);
    }
}

export function migrateManifest(data: ManifestData): ManifestData {
    switch (data.manifestVersion) {
        case '3.0':
        case '3.1':
            data.manifestVersion = currentManifestVersion;
            data.proxies = [];
            return data;
        default:
            throw new ZkSyncUpgradablePluginError('Manifest migration not available');
    }
}
export function normalizeManifestData(input: ManifestData): ManifestData {
    return {
        manifestVersion: input.manifestVersion,
        admin: input.admin && normalizeDeployment(input.admin),
        proxies: input.proxies.map((p) => normalizeDeployment(p, ['kind'])),
        impls: mapValues(input.impls, (i) => i && normalizeDeployment(i, ['layout', 'allAddresses'])),
    };
}

function normalizeDeployment<D extends Deployment>(input: D): Deployment;
function normalizeDeployment<D extends Deployment, K extends keyof D>(input: D, include: K[]): Deployment & Pick<D, K>;
function normalizeDeployment<D extends Deployment, K extends keyof D>(
    input: D,
    include: K[] = [],
): Deployment & Pick<D, K> {
    return pick(input, ['address', 'txHash', ...include]);
}
