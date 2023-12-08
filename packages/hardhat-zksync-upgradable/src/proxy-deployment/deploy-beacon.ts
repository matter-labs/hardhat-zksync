import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { Deployment } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { DeployBeaconOptions } from '../utils/options';
import { deploy, DeployTransaction } from './deploy';
import * as zk from 'zksync-ethers';
import { deployBeaconImpl } from './deploy-impl';
import { UPGRADABLE_BEACON_JSON } from '../constants';
import chalk from 'chalk';
import assert from 'assert';
import path from 'path';

export interface DeployBeaconFunction {
    (wallet: zk.Wallet, artifact: ZkSyncArtifact, opts?: DeployBeaconOptions, quiet?: boolean): Promise<zk.Contract>;
}

export function makeDeployBeacon(hre: HardhatRuntimeEnvironment): DeployBeaconFunction {
    return async function deployBeacon(
        wallet: zk.Wallet,
        artifact: ZkSyncArtifact,
        opts: DeployBeaconOptions = {},
        quiet: boolean = false
    ):Promise<zk.Contract> {
        const beaconImplFactory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);

        opts.provider = wallet.provider;
        const { impl } = await deployBeaconImpl(hre, beaconImplFactory, opts);
        if (!quiet) {
            console.info(chalk.green('Beacon impl deployed at', impl));
        }

        const upgradableBeaconPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
            x.includes(path.sep + UPGRADABLE_BEACON_JSON)
        );
        assert(upgradableBeaconPath, 'Upgradable beacon artifact not found');
        const upgradeableBeaconContract = await import(upgradableBeaconPath);

        const upgradeableBeaconFactory = new zk.ContractFactory<any[],zk.Contract>(
            upgradeableBeaconContract.abi,
            upgradeableBeaconContract.bytecode,
            wallet
        );
        const beaconDeployment: Required<Deployment & DeployTransaction> = await deploy(upgradeableBeaconFactory, impl);
        if (!quiet) {
            console.info(chalk.green('Beacon deployed at: ', beaconDeployment.address));
        }

        const beaconContract = upgradeableBeaconFactory.attach(beaconDeployment.address);
        // @ts-ignore Won't be readonly because beaconContract was created through attach.
        beaconContract.deployTransaction = beaconDeployment.deployTransaction;
        return beaconContract;
    };
}
