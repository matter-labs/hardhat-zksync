import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import path from 'path';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import chalk from 'chalk';
import assert from 'assert';
import {
    ContractAddressOrInstance,
    extractFactoryDeps,
    getArtifactFromBytecode,
    getContractAddress,
} from '../utils/utils-general';
import { UpgradeBeaconOptions } from '../utils/options';
import { deployBeaconImpl } from '../proxy-deployment/deploy-impl';
import { UPGRADABLE_BEACON_JSON } from '../constants';
import { ZkSyncUpgradablePluginError } from '../errors';
import { getUpgradableContracts } from '../utils';

export type UpgradeBeaconFactory = (
    beacon: ContractAddressOrInstance,
    factory: zk.ContractFactory,
    opts?: UpgradeBeaconOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export type UpgradeBeaconArtifact = (
    wallet: zk.Wallet,
    beacon: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    opts?: UpgradeBeaconOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export async function upgradeBeaconFactory(
    hre: HardhatRuntimeEnvironment,
    beacon: ContractAddressOrInstance,
    factory: zk.ContractFactory,
    opts?: UpgradeBeaconOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    const wallet = factory.signer && 'getAddress' in factory.signer ? (factory.signer as zk.Wallet) : undefined;
    if (!wallet) {
        throw new ZkSyncUpgradablePluginError('Wallet is required for upgrade.');
    }

    opts = opts || {};
    opts.provider = wallet.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, await getArtifactFromBytecode(hre, factory.bytecode));

    return upgradeBeacon(hre, wallet, beacon, factory, opts, quiet);
}

export async function upgradeBeaconArtifact(
    hre: HardhatRuntimeEnvironment,
    wallet: zk.Wallet,
    beacon: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    opts?: UpgradeBeaconOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    opts = opts || {};
    opts.provider = wallet.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, artifact as ZkSyncArtifact);

    return upgradeBeacon(hre, wallet, beacon, factory, opts, quiet);
}

async function upgradeBeacon(
    hre: HardhatRuntimeEnvironment,
    wallet: zk.Wallet,
    beaconImplementation: ContractAddressOrInstance,
    newImplementationFactory: zk.ContractFactory,
    opts: UpgradeBeaconOptions = {},
    quiet: boolean = false,
) {
    const beaconImplementationAddress = getContractAddress(beaconImplementation);
    const { impl: nextImpl } = await deployBeaconImpl(hre, newImplementationFactory, opts, beaconImplementationAddress);
    if (!quiet) {
        console.info(chalk.green('New beacon impl deployed at', nextImpl));
    }

    const upgradableBeaconPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
        x.includes(path.sep + getUpgradableContracts().UpgradeableBeacon + path.sep + UPGRADABLE_BEACON_JSON),
    );
    assert(upgradableBeaconPath, 'Upgradable beacon artifact not found');
    const upgradeableBeaconContract = await import(upgradableBeaconPath);

    const upgradeableBeaconFactory = new zk.ContractFactory(
        upgradeableBeaconContract.abi,
        upgradeableBeaconContract.bytecode,
        wallet,
    );

    const beaconContract = upgradeableBeaconFactory.attach(beaconImplementationAddress);
    const upgradeTx = await beaconContract.upgradeTo(nextImpl);

    // @ts-ignore Won't be readonly because beaconContract was created through attach.
    beaconContract.deployTransaction = upgradeTx;
    return beaconContract;
}

export function makeUpgradeBeacon(hre: HardhatRuntimeEnvironment): UpgradeBeaconArtifact | UpgradeBeaconFactory {
    return async function (...args: Parameters<UpgradeBeaconArtifact | UpgradeBeaconFactory>): Promise<zk.Contract> {
        const target = args[0];
        if (target instanceof zk.ContractFactory) {
            return await upgradeBeaconFactory(hre, ...(args as Parameters<UpgradeBeaconFactory>));
        } else {
            return upgradeBeaconArtifact(hre, ...(args as Parameters<UpgradeBeaconArtifact>));
        }
    };
}
