import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import { BeaconProxyUnsupportedError } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { extractFactoryDeps, getArtifactFromBytecode, getInitializerData } from '../utils/utils-general';
import { Manifest, ProxyDeployment } from '../core/manifest';
import { ZkSyncUpgradablePluginError } from '../errors';
import { DeployProxyOptions } from '../utils/options';
import {
    getProxyFactory,
    getTransparentUpgradeableProxyArtifact,
    getTransparentUpgradeableProxyFactory,
} from '../utils/factories';
import { deployProxyImpl } from './deploy-impl';
import { DeployTransaction, deploy } from './deploy';

export type DeployFunctionFactory = (
    factory: zk.ContractFactory,
    args?: unknown[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export type DeployFunctionFactoryNoArgs = (
    factory: zk.ContractFactory,
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export type DeployFunctionArtifact = (
    wallet: zk.Wallet,
    artifact: ZkSyncArtifact,
    args?: unknown[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeDeployProxy(
    hre: HardhatRuntimeEnvironment,
): DeployFunctionFactory | DeployFunctionFactoryNoArgs | DeployFunctionArtifact {
    return async function (
        ...args: Parameters<DeployFunctionFactory | DeployFunctionArtifact | DeployFunctionFactoryNoArgs>
    ): Promise<zk.Contract> {
        const target = args[0];
        if (target instanceof zk.ContractFactory) {
            const targetArgs = args[1];
            if (targetArgs && 'initializer' in targetArgs) {
                return await deployProxyFactoryNoArgs(hre, ...(args as Parameters<DeployFunctionFactoryNoArgs>));
            }
            return await deployProxyFactory(hre, ...(args as Parameters<DeployFunctionFactory>));
        } else {
            return deployProxyArtifact(hre, ...(args as Parameters<DeployFunctionArtifact>));
        }
    };
}

export async function deployProxyFactory(
    hre: HardhatRuntimeEnvironment,
    factory: zk.ContractFactory,
    args?: unknown[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    if (!Array.isArray(args)) {
        opts = args;
        args = [];
    }

    const wallet = factory.runner && 'getAddress' in factory.runner ? (factory.runner as zk.Wallet) : undefined;
    if (!wallet) {
        throw new ZkSyncUpgradablePluginError('Wallet is required for deployment');
    }
    opts = opts || {};
    opts.provider = wallet?.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, await getArtifactFromBytecode(hre, factory.bytecode));

    return deployProxy(hre, factory, wallet, args, opts, quiet);
}

export async function deployProxyFactoryNoArgs(
    hre: HardhatRuntimeEnvironment,
    factory: zk.ContractFactory,
    opts?: DeployProxyOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    const wallet = factory.runner && 'getAddress' in factory.runner ? (factory.runner as zk.Wallet) : undefined;
    if (!wallet) {
        throw new ZkSyncUpgradablePluginError('Wallet is required for deployment');
    }
    opts = opts || {};
    opts.provider = wallet?.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, await getArtifactFromBytecode(hre, factory.bytecode));

    return deployProxy(hre, factory, wallet, undefined, opts, quiet);
}

export async function deployProxyArtifact(
    hre: HardhatRuntimeEnvironment,
    wallet: zk.Wallet,
    artifact: ZkSyncArtifact,
    args?: unknown[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    opts = opts || {};
    opts.provider = wallet.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, artifact as ZkSyncArtifact);
    return deployProxy(hre, factory, wallet, args, opts, quiet);
}

async function deployProxy(
    hre: HardhatRuntimeEnvironment,
    factory: zk.ContractFactory,
    wallet: zk.Wallet,
    args: unknown[] | DeployProxyOptions = [],
    opts: DeployProxyOptions = {},
    quiet: boolean = false,
): Promise<zk.Contract> {
    if (!Array.isArray(args)) {
        opts = args;
        args = [];
    }

    const manifest = await Manifest.forNetwork(wallet.provider);
    const { impl, kind } = await deployProxyImpl(hre, factory, opts);
    if (!quiet) {
        console.info(chalk.green(`Implementation contract was deployed to ${impl}`));
    }

    const data = getInitializerData(factory.interface, args, opts.initializer);

    if (kind === 'uups') {
        if (await manifest.getAdmin()) {
            if (!quiet) {
                console.info(
                    chalk.yellow(
                        `A proxy admin was previously deployed on this network\nThis is not natively used with the current kind of proxy ('uups')\nChanges to the admin will have no effect on this new proxy`,
                    ),
                );
            }
        }
    }

    let proxyDeployment: Required<ProxyDeployment & DeployTransaction>;
    switch (kind) {
        case 'beacon': {
            throw new BeaconProxyUnsupportedError();
        }

        case 'uups': {
            const proxyFactory = await getProxyFactory(hre, wallet, opts.deploymentTypeProxy);

            const customDataProxyUups = {
                customData: {
                    salt: opts.saltProxy,
                    paymasterParams: opts.paymasterProxyParams,
                    ...opts.otherCustomData,
                },
            };

            proxyDeployment = { kind, ...(await deploy(proxyFactory, impl, data, customDataProxyUups)) };

            if (!quiet) {
                console.info(chalk.green(`UUPS proxy was deployed to ${proxyDeployment.address}`));
            }
            break;
        }

        case 'transparent': {
            const TUPFactory = await getTransparentUpgradeableProxyFactory(hre, wallet, opts.deploymentTypeProxy);
            const TUPArtifact = await getTransparentUpgradeableProxyArtifact(hre);

            const initialOwner = opts.initialOwner ?? wallet.address;

            const customDataProxyTup = {
                customData: {
                    salt: opts.saltProxy,
                    factoryDeps: await extractFactoryDeps(hre, TUPArtifact),
                    paymasterParams: opts.paymasterProxyParams,
                    ...opts.otherCustomData,
                },
            };

            proxyDeployment = { kind, ...(await deploy(TUPFactory, impl, initialOwner, data, customDataProxyTup)) };

            if (!quiet) {
                console.info(chalk.green(`Transparent proxy was deployed to ${proxyDeployment.address}`));
            }

            break;
        }

        default: {
            throw new ZkSyncUpgradablePluginError(`Unknown proxy kind: ${kind}`);
        }
    }

    await manifest.addProxy(proxyDeployment);
    const inst = factory.attach(proxyDeployment.address);
    // @ts-ignore Won't be readonly because inst was created through attach.
    inst.deployTransaction = proxyDeployment.deployTransaction;
    return inst.runner ? (inst as zk.Contract) : (inst.connect(wallet) as zk.Contract);
}
