import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { Contract } from 'ethers';

import { Deployment } from '@openzeppelin/upgrades-core';
import { DeployBeaconOptions } from './options';
import { deployBeaconImpl } from '@openzeppelin/hardhat-upgrades/src/utils';
import { getUpgradeableBeaconFactory } from './utils/factories';
import { deploy, DeployTransaction } from './deploy';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import * as zk from 'zksync-web3';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

export interface DeployBeaconFunction {
    (deployer: Deployer, artifact: ZkSyncArtifact, opts?: DeployBeaconOptions): Promise<Contract>;
}

export function makeDeployBeacon(hre: HardhatRuntimeEnvironment): DeployBeaconFunction {
    return async function deployBeacon(deployer: Deployer, artifact: ZkSyncArtifact, opts: DeployBeaconOptions = {}) {
        const factory = new zk.ContractFactory(
            artifact.abi,
            artifact.bytecode,
            deployer.zkWallet,
            deployer.deploymentType
        );

        const { impl } = await deployBeaconImpl(hre, factory, opts);

        const UpgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre, factory.signer);
        const beaconDeployment: Required<Deployment & DeployTransaction> = await deploy(deployer, artifact, impl);
        const beaconContract = UpgradeableBeaconFactory.attach(beaconDeployment.address);

        // @ts-ignore Won't be readonly because beaconContract was created through attach.
        beaconContract.deployTransaction = beaconDeployment.deployTransaction;
        return beaconContract;
    };
}
