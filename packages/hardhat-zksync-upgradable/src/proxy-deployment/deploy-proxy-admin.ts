import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import path from 'path';
import assert from 'assert';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { DeploymentType } from 'zksync-ethers/build/types';
import { DeployProxyAdminOptions } from '../utils/options';
import { PROXY_ADMIN_JSON } from '../constants';
import { fetchOrDeployAdmin } from '../core/impl-store';
import { getUpgradableContracts } from '../utils';
import { deploy } from './deploy';

export type DeployAdminFunction = (wallet?: zk.Wallet, opts?: DeployProxyAdminOptions) => Promise<string>;

export function makeDeployProxyAdmin(hre: HardhatRuntimeEnvironment): any {
    return async function deployProxyAdmin(wallet: zk.Wallet, opts: DeployProxyAdminOptions = {}) {
        const adminFactory = await getAdminFactory(hre, wallet, opts.deploymentType);
        return await fetchOrDeployAdmin(
            wallet.provider,
            () =>
                deploy(adminFactory, {
                    customData: {
                        salt: opts.salt,
                        paymasterParams: opts.paymasterParams,
                        ...opts.otherCustomData,
                    },
                }),
            opts,
        );
    };
}

export async function getAdminArtifact(hre: HardhatRuntimeEnvironment): Promise<ZkSyncArtifact> {
    const proxyAdminPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
        x.includes(path.sep + getUpgradableContracts().ProxyAdmin + path.sep + PROXY_ADMIN_JSON),
    );
    assert(proxyAdminPath, 'Proxy admin artifact not found');
    return await import(proxyAdminPath);
}

export async function getAdminFactory(
    hre: HardhatRuntimeEnvironment,
    wallet: zk.Wallet,
    deploymentType?: DeploymentType,
): Promise<zk.ContractFactory> {
    const proxyAdminContract = await getAdminArtifact(hre);
    return new zk.ContractFactory(proxyAdminContract.abi, proxyAdminContract.bytecode, wallet, deploymentType);
}
