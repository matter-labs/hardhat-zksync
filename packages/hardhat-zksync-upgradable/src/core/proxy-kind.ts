import {
    inferProxyKind,
    ValidationData,
    ValidationOptions,
    isBeaconProxy,
    isTransparentOrUUPSProxy,
    isTransparentProxy,
    BeaconProxyUnsupportedError,
    Version,
} from '@openzeppelin/upgrades-core';
import * as zk from 'zksync-ethers';
import { ZkSyncUpgradablePluginError } from '../errors';
import { Manifest, DeploymentNotFound, ProxyDeployment } from './manifest';

export async function setProxyKind(
    provider: zk.Provider,
    proxyAddress: string,
    opts: ValidationOptions,
): Promise<ProxyDeployment['kind']> {
    const manifest = await Manifest.forNetwork(provider);

    const manifestDeployment = await manifest.getProxyFromAddress(proxyAddress).catch((e) => {
        if (e instanceof DeploymentNotFound) {
            return undefined;
        } else {
            throw e;
        }
    });

    if (opts.kind === undefined) {
        opts.kind = manifestDeployment?.kind ?? 'transparent';
    } else if (manifestDeployment && opts.kind !== manifestDeployment.kind) {
        throw new ZkSyncUpgradablePluginError(
            `Requested an upgrade of kind ${opts.kind} but proxy is ${manifestDeployment.kind}`,
        );
    }

    return opts.kind;
}

export async function processProxyKind(
    provider: zk.Provider,
    proxyAddress: string | undefined,
    opts: ValidationOptions,
    data: ValidationData,
    version: Version,
) {
    if (opts.kind === undefined) {
        if (proxyAddress !== undefined && (await isBeaconProxy(provider, proxyAddress))) {
            opts.kind = 'beacon';
        } else {
            opts.kind = inferProxyKind(data, version);
        }
    }

    if (proxyAddress !== undefined) {
        await setProxyKind(provider, proxyAddress, opts);
    }

    if (opts.kind === 'beacon') {
        throw new BeaconProxyUnsupportedError();
    }
}
export async function detectProxyKind(provider: zk.Provider, proxyAddress: string) {
    let importKind: ProxyDeployment['kind'];
    if (await isTransparentProxy(provider, proxyAddress)) {
        importKind = 'transparent';
    } else if (await isTransparentOrUUPSProxy(provider, proxyAddress)) {
        importKind = 'uups';
    } else if (await isBeaconProxy(provider, proxyAddress)) {
        importKind = 'beacon';
    } else {
        throw new ZkSyncUpgradablePluginError(`Contract at ${proxyAddress} doesn't look like an ERC 1967 proxy`);
    }
    return importKind;
}
