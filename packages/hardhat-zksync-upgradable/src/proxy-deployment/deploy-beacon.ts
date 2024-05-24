import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { Deployment } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import { DeployBeaconOptions } from '../utils/options';
import { extractFactoryDeps } from '../utils/utils-general';
import { getUpgradeableBeaconFactory } from '../utils/factories';
import { deployBeaconImpl } from './deploy-impl';
import { deploy, DeployTransaction } from './deploy';

export type DeployBeaconFunction = (
    wallet: zk.Wallet,
    artifact: ZkSyncArtifact,
    opts?: DeployBeaconOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeDeployBeacon(hre: HardhatRuntimeEnvironment): DeployBeaconFunction {
    return async function deployBeacon(
        wallet: zk.Wallet,
        artifact: ZkSyncArtifact,
        opts: DeployBeaconOptions = {},
        quiet: boolean = false,
    ): Promise<zk.Contract> {
        const beaconImplFactory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet, opts.deploymentType);

        opts.provider = wallet.provider;
        opts.factoryDeps = await extractFactoryDeps(hre, artifact);

        const { impl } = await deployBeaconImpl(hre, beaconImplFactory, opts);
        if (!quiet) {
            console.info(chalk.green('Beacon impl deployed at', impl));
        }

        const initialOwner = opts.initialOwner ?? wallet.address;

        const upgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre, wallet);

        const beaconDeployment: Required<Deployment & DeployTransaction> = await deploy(
            upgradeableBeaconFactory,
            impl,
            initialOwner,
        );
        if (!quiet) {
            console.info(chalk.green('Beacon deployed at: ', beaconDeployment.address));
        }

        const beaconContract = upgradeableBeaconFactory.attach(beaconDeployment.address);
        // @ts-ignore Won't be readonly because beaconContract was created through attach.
        beaconContract.deployTransaction = beaconDeployment.deployTransaction;
        return beaconContract;
    };
}
