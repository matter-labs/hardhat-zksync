import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-web3';

import { DeployProxyAdminOptions } from '../utils/options';
import { deploy } from './deploy';
import { PROXY_ADMIN_JSON } from '../constants';
import { importProxyContract } from '../utils/utils-general';
import { fetchOrDeployAdmin } from '../core/impl-store';

export interface DeployAdminFunction {
    (wallet?: zk.Wallet, opts?: DeployProxyAdminOptions): Promise<string>;
}

export function makeDeployProxyAdmin(hre: HardhatRuntimeEnvironment): any {
    return async function deployProxyAdmin(wallet: zk.Wallet, opts: DeployProxyAdminOptions = {}) {
        const proxyAdminContract = await importProxyContract('..', hre.config.zksolc.version, PROXY_ADMIN_JSON);

        const adminFactory = new zk.ContractFactory(proxyAdminContract.abi, proxyAdminContract.bytecode, wallet);
        return await fetchOrDeployAdmin(wallet.provider, () => deploy(adminFactory), opts);
    };
}
