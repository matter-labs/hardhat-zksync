import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-web3';

import { DeployProxyAdminOptions } from '../utils/options';
import { deploy } from './deploy';
import { PROXY_ADMIN_JSON } from '../constants';
import { fetchOrDeployAdmin } from '../core/impl-store';
import assert from 'assert';

export interface DeployAdminFunction {
    (wallet?: zk.Wallet, opts?: DeployProxyAdminOptions): Promise<string>;
}

export function makeDeployProxyAdmin(hre: HardhatRuntimeEnvironment): any {
    return async function deployProxyAdmin(wallet: zk.Wallet, opts: DeployProxyAdminOptions = {}) {
        const adminFactory = await getAdminFactory(hre, wallet);
        return await fetchOrDeployAdmin(wallet.provider, () => deploy(adminFactory), opts);
    };
}

export async function getAdminFactory(hre: HardhatRuntimeEnvironment, wallet: zk.Wallet): Promise<zk.ContractFactory> {
    const proxyAdminPath = (await hre.artifacts.getArtifactPaths()).find((x) => x.includes(PROXY_ADMIN_JSON));
    assert(proxyAdminPath, 'Proxy admin artifact not found');
    const proxyAdminContract = await import(proxyAdminPath);

    return new zk.ContractFactory(proxyAdminContract.abi, proxyAdminContract.bytecode, wallet);
}
