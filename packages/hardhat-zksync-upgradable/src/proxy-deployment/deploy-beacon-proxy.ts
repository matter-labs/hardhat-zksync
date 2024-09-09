import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import {
    ProxyDeployment,
    isBeacon,
    DeployBeaconProxyUnsupportedError,
    DeployBeaconProxyKindError,
} from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-ethers';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import chalk from 'chalk';
import { ContractAddressOrInstance, getContractAddress, getInitializerData } from '../utils/utils-general';
import { DeployBeaconProxyOptions } from '../utils/options';
import { Manifest } from '../core/manifest';
import { getBeaconProxyFactory } from '../utils/factories';
import { deploy, DeployTransaction } from './deploy';

export type DeployBeaconProxyFactory = (
    beacon: ContractAddressOrInstance,
    factory: zk.ContractFactory,
    args?: unknown[],
    opts?: DeployBeaconProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export type DeployBeaconProxyArtifact = (
    wallet: zk.Wallet,
    beacon: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    args?: unknown[],
    opts?: DeployBeaconProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeDeployBeaconProxy(
    hre: HardhatRuntimeEnvironment,
): DeployBeaconProxyFactory | DeployBeaconProxyArtifact {
    return async function (
        ...args: Parameters<DeployBeaconProxyFactory | DeployBeaconProxyArtifact>
    ): Promise<zk.Contract> {
        const target = args[1];
        if (target instanceof zk.ContractFactory) {
            return deployBeaconProxyFactory(hre, ...(args as Parameters<DeployBeaconProxyFactory>));
        } else {
            return deployBeaconProxyArtifact(hre, ...(args as Parameters<DeployBeaconProxyArtifact>));
        }
    };
}

export function deployBeaconProxyArtifact(
    hre: HardhatRuntimeEnvironment,
    wallet: zk.Wallet,
    beacon: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    args: unknown[] = [],
    opts: DeployBeaconProxyOptions = {},
    quiet: boolean = false,
): Promise<zk.Contract> {
    if (opts && opts.kind !== undefined && opts.kind !== 'beacon') {
        throw new DeployBeaconProxyKindError(opts.kind);
    }
    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    opts = opts || {};
    opts.kind = 'beacon';
    return deployBeaconProxy(hre, beacon, factory, args, opts, wallet, quiet);
}

export async function deployBeaconProxyFactory(
    hre: HardhatRuntimeEnvironment,
    beacon: ContractAddressOrInstance,
    factory: zk.ContractFactory,
    args: unknown[] = [],
    opts: DeployBeaconProxyOptions = {},
    quiet: boolean = false,
): Promise<zk.Contract> {
    if (opts && opts.kind !== undefined && opts.kind !== 'beacon') {
        throw new DeployBeaconProxyKindError(opts.kind);
    }
    opts = opts || {};
    opts.kind = 'beacon';

    const wallet = factory.runner && 'getAddress' in factory.runner ? (factory.runner as zk.Wallet) : undefined;
    if (!wallet) throw new Error('Wallet not found. Please pass it in the arguments.');

    return deployBeaconProxy(hre, beacon, factory, args, opts, wallet, quiet);
}

async function deployBeaconProxy(
    hre: HardhatRuntimeEnvironment,
    beacon: ContractAddressOrInstance,
    attachTo: zk.ContractFactory,
    args: unknown[] = [],
    opts: DeployBeaconProxyOptions = {},
    wallet: zk.Wallet,
    quiet: boolean = false,
): Promise<zk.Contract> {
    if (!Array.isArray(args)) {
        opts = args;
        args = [];
    }

    const manifest = await Manifest.forNetwork(wallet.provider);
    const beaconAddress = await getContractAddress(beacon);
    if (!(await isBeacon(wallet.provider, beaconAddress))) {
        throw new DeployBeaconProxyUnsupportedError(beaconAddress);
    }

    const data = getInitializerData(attachTo.interface, args, opts.initializer);

    if (await manifest.getAdmin()) {
        if (!quiet) {
            console.info(
                chalk.yellow(`A proxy admin was previously deployed on this network`, [
                    `This is not natively used with the current kind of proxy ('beacon').`,
                    `Changes to the admin will have no effect on this new proxy.`,
                ]),
            );
        }
    }

    const beaconProxyFactory = await getBeaconProxyFactory(hre, wallet, opts.deploymentType);

    const proxyDeployment: Required<ProxyDeployment & DeployTransaction> = {
        kind: opts.kind!,
        ...(await deploy(beaconProxyFactory, beaconAddress, data, {
            customData: {
                salt: opts.salt,
                paymasterParams: opts.paymasterParams,
                ...opts.otherCustomData,
            },
        })),
    };

    if (!quiet) {
        console.info(chalk.green('Beacon proxy deployed at: ', proxyDeployment.address));
    }

    await manifest.addProxy(proxyDeployment);

    const inst = attachTo.attach(proxyDeployment.address) as zk.Contract;
    // @ts-ignore Won't be readonly because inst was created through attach.
    inst.deployTransaction = proxyDeployment.deployTransaction;
    return inst.runner ? inst : (inst.connect(wallet) as zk.Contract);
}
