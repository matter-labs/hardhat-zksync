import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { Deployment } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { DeployBeaconOptions } from '../utils/options';
import { deploy, DeployTransaction } from './deploy';
import * as zk from 'zksync-web3';
import { deployBeaconImpl } from './deploy-impl';
import { importProxyContract } from '../utils/utils-general';
import { UPGRADABLE_BEACON_JSON } from '../constants';
import chalk from 'chalk';

export interface DeployBeaconFunction {
    (wallet: zk.Wallet, artifact: ZkSyncArtifact, opts?: DeployBeaconOptions): Promise<zk.Contract>;
}

export function makeDeployBeacon(hre: HardhatRuntimeEnvironment): DeployBeaconFunction {
    return async function deployBeacon(wallet: zk.Wallet, artifact: ZkSyncArtifact, opts: DeployBeaconOptions = {}) {
        const beaconImplFactory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);

        opts.provider = wallet.provider;
        const { impl } = await deployBeaconImpl(hre, beaconImplFactory, opts);
        console.info(chalk.green('Beacon impl deployed at', impl));

        const upgradeableBeaconContract = await importProxyContract(
            '..',
            hre.config.zksolc.version,
            UPGRADABLE_BEACON_JSON
        );
        const upgradeableBeaconFactory = new zk.ContractFactory(
            upgradeableBeaconContract.abi,
            upgradeableBeaconContract.bytecode,
            wallet
        );
        const beaconDeployment: Required<Deployment & DeployTransaction> = await deploy(upgradeableBeaconFactory, impl);

        const beaconContract = upgradeableBeaconFactory.attach(beaconDeployment.address);
        // @ts-ignore Won't be readonly because beaconContract was created through attach.
        beaconContract.deployTransaction = beaconDeployment.deployTransaction;
        return beaconContract;
    };
}
