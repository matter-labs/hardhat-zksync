import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { Signer } from 'ethers';
import { DeployProxyAdminOptions } from './options';
import { getProxyAdminFactory } from '@openzeppelin/hardhat-upgrades/src/utils';
import { deploy } from './deploy';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import * as ethers from 'ethers';
import { fetchOrDeployAdmin } from '@openzeppelin/upgrades-core';

export interface DeployAdminFunction {
    (deployer?: Deployer, opts?: DeployProxyAdminOptions): Promise<string>;
}

// TODO: Check continuiation
export function makeDeployProxyAdmin(hre: HardhatRuntimeEnvironment): any {
    return async function deployProxyAdmin(deployer: Deployer, opts: DeployProxyAdminOptions = {}) {
        const { provider } = hre.network;

        // const AdminFactory = await getProxyAdminFactory(hre, deployer.zkWallet);
        const proxyAdminContract = await deployer.loadArtifact('ProxyAdmin');
        return await fetchOrDeployAdmin(provider, () => deploy(deployer, proxyAdminContract, []), opts);

        // const proxyAdminContract = await deployer.loadArtifact('ProxyAdmin');
        // return deploy(deployer, proxyAdminContract, deployer, []);

        // return proxyAdminContract.address;
        // return '0xe593c7AD0776abC834299bCbdb6536e2e1A288eA';
    };
}
