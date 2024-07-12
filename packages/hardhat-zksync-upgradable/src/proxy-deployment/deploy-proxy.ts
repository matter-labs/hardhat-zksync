import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import path from 'path';
import { BeaconProxyUnsupportedError } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import assert from 'assert';
import { extractFactoryDeps, getInitializerData } from '../utils/utils-general';
import { ERC1967_PROXY_JSON, TUP_JSON } from '../constants';
import { Manifest, ProxyDeployment } from '../core/manifest';
import { DeployProxyOptions } from '../utils/options';
import { ZkSyncUpgradablePluginError } from '../errors';
import { deployProxyImpl } from './deploy-impl';
import { DeployTransaction, deploy } from './deploy';

export type DeployFunctionFactory = (
    factory: zk.ContractFactory,
    args?: unknown[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export type DeployFunctionArtifact = (
    artifact: ZkSyncArtifact,
    wallet: zk.Wallet,
    args?: unknown[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeDeployProxy(hre: HardhatRuntimeEnvironment): DeployFunctionFactory | DeployFunctionArtifact {
    return async function (...args: Parameters<DeployFunctionFactory | DeployFunctionArtifact>): Promise<zk.Contract> {
        const target = args[0];
        if (target instanceof zk.ContractFactory) {
            return deployProxyFactory(hre, ...(args as Parameters<DeployFunctionFactory>));
        } else {
            return deployProxyArtifact(hre, ...(args as Parameters<DeployFunctionArtifact>));
        }
    };
}

export function deployProxyFactory(
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
    opts = opts || {};
    opts.provider = wallet?.provider;
    return deployProxy(hre, factory, wallet, args, opts, quiet);
}

export async function deployProxyArtifact(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    wallet: zk.Wallet,
    args?: unknown[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    if (!Array.isArray(args)) {
        opts = args;
        args = [];
    }

    opts = opts || {};
    opts.provider = wallet.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, artifact as ZkSyncArtifact);
    return deployProxy(hre, factory, wallet, args, opts, quiet);
}

async function deployProxy(
    hre: HardhatRuntimeEnvironment,
    factory: zk.ContractFactory,
    wallet: zk.Wallet | undefined,
    args: unknown[] | DeployProxyOptions = [],
    opts: DeployProxyOptions = {},
    quiet: boolean = false,
): Promise<zk.Contract> {
    if (!Array.isArray(args)) {
        opts = args;
        args = [];
    }

    if (!wallet) {
        throw new ZkSyncUpgradablePluginError('Wallet is required for deployment');
    }
    const manifest = await Manifest.forNetwork(wallet.provider);

    const { impl, kind } = await deployProxyImpl(hre, factory, opts);
    if (!quiet) {
        console.info(chalk.green(`Implementation contract was deployed to ${impl}`));
    }

    const data = getInitializerData(factory.interface, args, opts.initializer);

    const customDataProxy = {
        customData: {
            salt: opts.saltProxy,
        },
    };

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
            const ERC1967ProxyPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
                x.includes(path.sep + ERC1967_PROXY_JSON),
            );
            assert(ERC1967ProxyPath, 'ERC1967Proxy artifact not found');
            const proxyContract = await import(ERC1967ProxyPath);
            const proxyFactory = new zk.ContractFactory(
                proxyContract.abi,
                proxyContract.bytecode,
                wallet,
                opts.deploymentTypeProxy,
            );
            proxyDeployment = { kind, ...(await deploy(proxyFactory, impl, data, customDataProxy)) };

            if (!quiet) {
                console.info(chalk.green(`UUPS proxy was deployed to ${proxyDeployment.address}`));
            }
            break;
        }

        case 'transparent': {
            const adminAddress = await hre.zkUpgrades.deployProxyAdmin(wallet, {});
            if (!quiet) {
                console.info(chalk.green(`Admin was deployed to ${adminAddress}`));
            }

            const TUPPath = (await hre.artifacts.getArtifactPaths()).find((x) => x.includes(path.sep + TUP_JSON));
            assert(TUPPath, 'TUP artifact not found');
            const TUPContract = await import(TUPPath);

            const TUPFactory = new zk.ContractFactory(
                TUPContract.abi,
                TUPContract.bytecode,
                wallet,
                opts.deploymentTypeProxy,
            );
            proxyDeployment = { kind, ...(await deploy(TUPFactory, impl, adminAddress, data, customDataProxy)) };

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
