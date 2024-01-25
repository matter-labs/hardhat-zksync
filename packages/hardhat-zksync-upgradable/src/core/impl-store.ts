import {
    Deployment,
    InvalidDeployment,
    resumeOrDeploy,
    waitAndValidateDeployment,
    DeployOpts,
    Version,
    getClientVersion,
} from '@openzeppelin/upgrades-core';

import assert from 'assert';
import * as zk from 'zksync-ethers';
import { Manifest, ManifestData, ImplDeployment } from './manifest';
import { getChainId } from './provider';

interface ManifestLens<T> {
    description: string;
    type: string;
    (data: ManifestData): ManifestField<T>;
}

export interface ManifestField<T> {
    get(): T | undefined;
    set(value: T | undefined): void;
    merge?(value: T | undefined): void;
}

async function fetchOrDeployGeneric<T extends Deployment, U extends T = T>(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    lens: ManifestLens<T>,
    provider: zk.Provider,
    deploy: () => Promise<U>,
    opts?: DeployOpts,
    merge?: boolean,
): Promise<U | Deployment> {
    const manifest = await Manifest.forNetwork(provider);

    try {
        const deployment = await manifest.lockedRun(async () => {
            const data = await manifest.read();
            const deploymentInternal = lens(data);
            if (merge && !deploymentInternal.merge) {
                throw new Error(
                    'fetchOrDeployGeneric was called with merge set to true but the deployment lens does not have a merge function',
                );
            }

            const stored = deploymentInternal.get();
            const updated = await resumeOrDeploy(provider, stored, deploy, lens.type, opts, deploymentInternal, merge);
            if (updated !== stored) {
                if (merge && deploymentInternal.merge) {
                    await checkForAddressClash(provider, data, updated, false);
                    deploymentInternal.merge(updated);
                } else {
                    await checkForAddressClash(provider, data, updated, true);
                    deploymentInternal.set(updated);
                }
                await manifest.write(data);
            }
            return updated;
        });

        await waitAndValidateDeployment(provider, deployment, lens.type, opts);

        return deployment;
    } catch (e) {
        if (e instanceof InvalidDeployment) {
            await manifest.lockedRun(async () => {
                assert(e instanceof InvalidDeployment);
                const data = await manifest.read();
                const deployment = lens(data);
                const stored = deployment.get();
                if (stored?.txHash === e.deployment.txHash) {
                    deployment.set(undefined);
                    await manifest.write(data);
                }
            });
            e.removed = true;
        }

        throw e;
    }
}

export function deleteDeployment(deployment: ManifestField<Deployment>) {
    deployment.set(undefined);
}

export async function fetchOrDeploy(
    version: Version,
    provider: zk.Provider,
    deploy: () => Promise<ImplDeployment>,
    opts?: DeployOpts,
    merge?: boolean,
): Promise<string> {
    return (await fetchOrDeployGeneric(implLens(version.linkedWithoutMetadata), provider, deploy, opts, merge)).address;
}

export async function fetchOrDeployGetDeployment<T extends ImplDeployment>(
    version: Version,
    provider: zk.Provider,
    deploy: () => Promise<T>,
    opts?: DeployOpts,
    merge?: boolean,
): Promise<T | Deployment> {
    return fetchOrDeployGeneric(implLens(version.linkedWithoutMetadata), provider, deploy, opts, merge);
}

const implLens = (versionWithoutMetadata: string) =>
    lens(`implementation ${versionWithoutMetadata}`, 'implementation', (data) => ({
        get: () => data.impls[versionWithoutMetadata],
        set: (value?: ImplDeployment) => (data.impls[versionWithoutMetadata] = value),
        merge: (value?: ImplDeployment) => {
            const existing = data.impls[versionWithoutMetadata];
            if (existing !== undefined && value !== undefined) {
                const { address, allAddresses } = mergeAddresses(existing, value);
                data.impls[versionWithoutMetadata] = { ...existing, address, allAddresses };
            } else {
                data.impls[versionWithoutMetadata] = value;
            }
        },
    }));

export function mergeAddresses(existing: ImplDeployment, value: ImplDeployment) {
    const merged = new Set<string>();

    merged.add(existing.address);
    merged.add(value.address);

    existing.allAddresses?.forEach((item) => merged.add(item));
    value.allAddresses?.forEach((item) => merged.add(item));

    return { address: existing.address, allAddresses: Array.from(merged) };
}

export async function fetchOrDeployAdmin(
    provider: zk.Provider,
    deploy: () => Promise<Deployment>,
    opts?: DeployOpts,
): Promise<string> {
    return (await fetchOrDeployGeneric(adminLens, provider, deploy, opts)).address;
}

const adminLens = lens('proxy admin', 'proxy admin', (data) => ({
    get: () => data.admin,
    set: (value?: Deployment) => (data.admin = value),
}));

function lens<T>(description: string, type: string, fn: (data: ManifestData) => ManifestField<T>): ManifestLens<T> {
    return Object.assign(fn, { description, type });
}

export async function isDevelopmentNetwork(provider: zk.Provider): Promise<boolean> {
    const chainId = await getChainId(provider);
    if (chainId === 1337 || chainId === 31337) {
        return true;
    } else {
        const clientVersion = await getClientVersion(provider);
        const [name] = clientVersion.split('/', 1);
        return name === 'HardhatNetwork' || name === 'EthereumJS TestRPC' || name === 'anvil';
    }
}

async function checkForAddressClash(
    provider: zk.Provider,
    data: ManifestData,
    updated: Deployment,
    checkAllAddresses: boolean,
): Promise<void> {
    const clash = lookupDeployment(data, updated.address, checkAllAddresses);
    if (clash !== undefined) {
        if (await isDevelopmentNetwork(provider)) {
            clash.set(undefined);
        } else {
            throw new Error(
                `The following deployment clashes with an existing one at ${updated.address}\n\n${JSON.stringify(
                    updated,
                    null,
                    2,
                )}\n\n`,
            );
        }
    }
}

function lookupDeployment(
    data: ManifestData,
    address: string,
    checkAllAddresses: boolean,
): ManifestField<Deployment> | undefined {
    if (data.admin?.address === address) {
        return adminLens(data);
    }

    for (const versionWithoutMetadata in data.impls) {
        if (
            data.impls[versionWithoutMetadata]?.address === address ||
            (checkAllAddresses && data.impls[versionWithoutMetadata]?.allAddresses?.includes(address))
        ) {
            return implLens(versionWithoutMetadata)(data);
        }
    }
}
