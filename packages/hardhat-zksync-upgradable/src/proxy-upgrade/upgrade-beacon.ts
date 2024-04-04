import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import path from 'path';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import chalk from 'chalk';
import assert from 'assert';
import { ContractAddressOrInstance, extractFactoryDeps, getContractAddress } from '../utils/utils-general';
import { UpgradeBeaconOptions } from '../utils/options';
import { deployBeaconImpl } from '../proxy-deployment/deploy-impl';
import { UPGRADABLE_BEACON_JSON } from '../constants';

export type UpgradeBeaconFunction = (
    wallet: zk.Wallet,
    beacon: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    opts?: UpgradeBeaconOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeUpgradeBeacon(hre: HardhatRuntimeEnvironment): UpgradeBeaconFunction {
    return async function upgradeBeacon(
        wallet,
        beaconImplementation,
        newImplementationArtifact,
        opts: UpgradeBeaconOptions = {},
        quiet: boolean = false,
    ) {
        const factory = new zk.ContractFactory(
            newImplementationArtifact.abi,
            newImplementationArtifact.bytecode,
            wallet,
            opts.deploymentType,
        );

        opts.provider = wallet.provider;
        opts.factoryDeps = await extractFactoryDeps(hre, newImplementationArtifact);

        const beaconImplementationAddress = await getContractAddress(beaconImplementation);
        const { impl: nextImpl } = await deployBeaconImpl(hre, factory, opts, beaconImplementationAddress);
        if (!quiet) {
            console.info(chalk.green('New beacon impl deployed at', nextImpl));
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

        const beaconContract = upgradeableBeaconFactory.attach(beaconImplementationAddress);
        const upgradeTx = await beaconContract.upgradeTo(nextImpl);

        // @ts-ignore Won't be readonly because beaconContract was created through attach.
        beaconContract.deployTransaction = upgradeTx;
        return beaconContract;
    };
}
