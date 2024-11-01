import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { Deployment } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import { extractFactoryDeps, getArtifactFromBytecode } from '../utils/utils-general';
import { ZkSyncUpgradablePluginError } from '../errors';
import { DeployBeaconOptions } from '../utils/options';
import { getUpgradeableBeaconFactory } from '../utils/factories';
import { deployBeaconImpl } from './deploy-impl';
import { deploy, DeployTransaction } from './deploy';

export type DeployBeaconFactory = (
    factory: zk.ContractFactory,
    opts?: DeployBeaconOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export type DeployBeaconArtifact = (
    wallet: zk.Wallet,
    artifact: ZkSyncArtifact,
    args?: unknown[],
    opts?: DeployBeaconOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeDeployBeacon(hre: HardhatRuntimeEnvironment): DeployBeaconFactory | DeployBeaconArtifact {
    return async function (...args: Parameters<DeployBeaconFactory | DeployBeaconArtifact>): Promise<zk.Contract> {
        const target = args[0];
        if (target instanceof zk.ContractFactory) {
            return await deployBeaconFactory(hre, ...(args as Parameters<DeployBeaconFactory>));
        } else {
            return deployBeaconArtifact(hre, ...(args as Parameters<DeployBeaconArtifact>));
        }
    };
}

export async function deployBeaconFactory(
    hre: HardhatRuntimeEnvironment,
    factory: zk.ContractFactory,
    opts?: DeployBeaconOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    const wallet = factory.runner && 'getAddress' in factory.runner ? (factory.runner as zk.Wallet) : undefined;
    if (!wallet) {
        throw new ZkSyncUpgradablePluginError('Wallet is required for deployment');
    }

    opts = opts || {};
    opts.provider = wallet?.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, await getArtifactFromBytecode(hre, factory.bytecode));

    return deployProxyBeacon(hre, factory, wallet, undefined, opts, quiet);
}

export async function deployBeaconArtifact(
    hre: HardhatRuntimeEnvironment,
    wallet: zk.Wallet,
    artifact: ZkSyncArtifact,
    args?: unknown[],
    opts?: DeployBeaconOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    opts = opts || {};
    opts.provider = wallet.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, artifact as ZkSyncArtifact);
    return deployProxyBeacon(hre, factory, wallet, args, opts, quiet);
}

async function deployProxyBeacon(
    hre: HardhatRuntimeEnvironment,
    factory: zk.ContractFactory,
    wallet: zk.Wallet,
    args: unknown[] | DeployBeaconOptions = [],
    opts: DeployBeaconOptions = {},
    quiet: boolean = false,
): Promise<zk.Contract> {
    if (!Array.isArray(args)) {
        opts = args;
        args = [];
    }

    const { impl } = await deployBeaconImpl(hre, factory, opts);
    if (!quiet) {
        console.info(chalk.green('Beacon impl deployed at', impl));
    }

    const customDataBeacon = {
        customData: {
            salt: opts.salt,
            paymasterParams: opts.paymasterParams,
            ...opts.otherCustomData,
        },
    };

    const upgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre, wallet);

    const beaconDeployment: Required<Deployment & DeployTransaction> = await deploy(
        upgradeableBeaconFactory,
        impl,
        opts.initialOwner ?? wallet.address,
        customDataBeacon,
    );

    if (!quiet) {
        console.info(chalk.green('Beacon deployed at: ', beaconDeployment.address));
    }

    const beaconContract = upgradeableBeaconFactory.attach(beaconDeployment.address);
    // @ts-ignore Won't be readonly because beaconContract was created through attach.
    beaconContract.deployTransaction = beaconDeployment.deployTransaction;
    return beaconContract.runner ? beaconContract : (beaconContract.connect(wallet) as zk.Contract);
}
