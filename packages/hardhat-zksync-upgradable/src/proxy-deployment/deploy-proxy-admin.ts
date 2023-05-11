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
        const proxyAdminPaths = (await hre.artifacts.getArtifactPaths()).filter((x) => x.includes(PROXY_ADMIN_JSON));
        assert(proxyAdminPaths.length == 1, 'Proxy admin artifact not found');
        const proxyAdminContract = await import(proxyAdminPaths[0]);

        const adminFactory = new zk.ContractFactory(proxyAdminContract.abi, proxyAdminContract.bytecode, wallet);
        return await fetchOrDeployAdmin(wallet.provider, () => deploy(adminFactory), opts);
    };
}
