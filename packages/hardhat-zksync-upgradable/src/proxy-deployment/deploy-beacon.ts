import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { Deployment } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import assert from 'assert';
import path from 'path';
import { UPGRADABLE_BEACON_JSON } from '../constants';
import { DeployBeaconOptions } from '../utils/options';
import { extractFactoryDeps, getWallet } from '../utils/utils-general';
import { deployBeaconImpl } from './deploy-impl';
import { deploy, DeployTransaction } from './deploy';

export type DeployBeaconFunction = (
    artifactOrFactory: ZkSyncArtifact | zk.ContractFactory,
    opts?: DeployBeaconOptions,
    wallet?: zk.Wallet,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeDeployBeacon(hre: HardhatRuntimeEnvironment): DeployBeaconFunction {
    return async function deployBeacon(
        artifactOrFactory: ZkSyncArtifact | zk.ContractFactory,
        opts: DeployBeaconOptions = {},
        wallet: zk.Wallet | undefined,
        quiet: boolean = false,
    ): Promise<zk.Contract> {
        let beaconImplFactory: zk.ContractFactory<any[], zk.Contract>;

        if ('abi' in artifactOrFactory && 'bytecode' in artifactOrFactory) {
            beaconImplFactory = new zk.ContractFactory(
                artifactOrFactory.abi,
                artifactOrFactory.bytecode,
                wallet,
                opts.deploymentType,
            );
        } else {
            beaconImplFactory = artifactOrFactory as zk.ContractFactory<any[], zk.Contract>;
            wallet = getWallet(beaconImplFactory.runner, wallet);
        }

        if (!wallet) throw new Error('Wallet not found. Please pass it in the arguments.');

        opts.provider = wallet.provider;
        opts.factoryDeps = await extractFactoryDeps(hre, artifactOrFactory as ZkSyncArtifact);

        const { impl } = await deployBeaconImpl(hre, beaconImplFactory, opts);
        if (!quiet) {
            console.info(chalk.green('Beacon impl deployed at', impl));
        }

        const upgradableBeaconPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
            x.includes(path.sep + UPGRADABLE_BEACON_JSON),
        );
        assert(upgradableBeaconPath, 'Upgradable beacon artifact not found');
        const upgradeableBeaconContract = await import(upgradableBeaconPath);

        const upgradeableBeaconFactory = new zk.ContractFactory<any[], zk.Contract>(
            upgradeableBeaconContract.abi,
            upgradeableBeaconContract.bytecode,
            wallet,
        );
        const beaconDeployment: Required<Deployment & DeployTransaction> = await deploy(upgradeableBeaconFactory, impl);
        if (!quiet) {
            console.info(chalk.green('Beacon deployed at: ', beaconDeployment.address));
        }

        const beaconContract = upgradeableBeaconFactory.attach(beaconDeployment.address);
        // @ts-ignore Won't be readonly because beaconContract was created through attach.
        beaconContract.deployTransaction = beaconDeployment.deployTransaction;
        return beaconContract.runner ? beaconContract : (beaconContract.connect(wallet) as zk.Contract);
    };
}
