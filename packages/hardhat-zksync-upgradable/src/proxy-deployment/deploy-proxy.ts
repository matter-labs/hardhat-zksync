import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import path from 'path';
import { BeaconProxyUnsupportedError } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import assert from 'assert';
import { extractFactoryDeps, getInitializerData, getWallet } from '../utils/utils-general';
import { ERC1967_PROXY_JSON, TUP_JSON } from '../constants';
import { Manifest, ProxyDeployment } from '../core/manifest';
import { DeployProxyOptions } from '../utils/options';
import { ZkSyncUpgradablePluginError } from '../errors';
import { deployProxyImpl } from './deploy-impl';
import { DeployTransaction, deploy } from './deploy';

export type DeployFunction = (
    artifactOrFactory: ZkSyncArtifact | zk.ContractFactory,
    args?: unknown[],
    opts?: DeployProxyOptions,
    wallet?: zk.Wallet,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeDeployProxy(hre: HardhatRuntimeEnvironment): DeployFunction {
    return async function deployProxy(
        artifactOrFactory: ZkSyncArtifact | zk.ContractFactory,
        args: unknown[] | DeployProxyOptions = [],
        opts: DeployProxyOptions = {},
        wallet: zk.Wallet | undefined,
        quiet: boolean = false,
    ): Promise<zk.Contract> {
        if (!Array.isArray(args)) {
            opts = args;
            args = [];
        }

        let factory: zk.ContractFactory<any[], zk.Contract>;

        if ('abi' in artifactOrFactory && 'bytecode' in artifactOrFactory) {
            factory = new zk.ContractFactory<any[], zk.Contract>(
                artifactOrFactory.abi,
                artifactOrFactory.bytecode,
                wallet,
                opts.deploymentTypeImpl,
            );
        } else {
            factory = artifactOrFactory as zk.ContractFactory<any[], zk.Contract>;
            wallet = getWallet(factory.runner, wallet);
        }

        if (!wallet) throw new Error('Wallet not found. Please pass it in the arguments.');

        opts.provider = wallet.provider;
        opts.factoryDeps = await extractFactoryDeps(hre, artifactOrFactory as ZkSyncArtifact);

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
        return inst.runner ? inst : (inst.connect(wallet) as zk.Contract);
    };
}
