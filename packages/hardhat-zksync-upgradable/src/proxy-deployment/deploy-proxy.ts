import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import { BeaconProxyUnsupportedError } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { extractFactoryDeps, getInitializerData } from '../utils/utils-general';
import { Manifest, ProxyDeployment } from '../core/manifest';
import { DeployProxyOptions } from '../utils/options';
import { ZkSyncUpgradablePluginError } from '../errors';
import { getProxyFactory, getTransparentUpgradeableProxyFactory } from '../utils/factories';
import { deployProxyImpl } from './deploy-impl';
import { DeployTransaction, deploy } from './deploy';

export type DeployFunction = (
    wallet: zk.Wallet,
    artifact: ZkSyncArtifact,
    args?: unknown[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeDeployProxy(hre: HardhatRuntimeEnvironment): DeployFunction {
    return async function deployProxy(
        wallet,
        artifact,
        args: unknown[] | DeployProxyOptions = [],
        opts: DeployProxyOptions = {},
        quiet: boolean = false,
    ): Promise<zk.Contract> {
        if (!Array.isArray(args)) {
            opts = args;
            args = [];
        }
        opts.provider = wallet.provider;
        opts.factoryDeps = await extractFactoryDeps(hre, artifact);

        const manifest = await Manifest.forNetwork(wallet.provider);

        const factory = new zk.ContractFactory<any[], zk.Contract>(
            artifact.abi,
            artifact.bytecode,
            wallet,
            opts.deploymentTypeImpl,
        );

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
                const proxyFactory = await getProxyFactory(hre, wallet);
                proxyDeployment = { kind, ...(await deploy(proxyFactory, impl, data, customDataProxy)) };

                if (!quiet) {
                    console.info(chalk.green(`UUPS proxy was deployed to ${proxyDeployment.address}`));
                }
                break;
            }

            case 'transparent': {
                const initialOwner = opts.initialOwner ?? wallet.address;

                const TUPFactory = await getTransparentUpgradeableProxyFactory(hre, wallet);
                proxyDeployment = { kind, ...(await deploy(TUPFactory, impl, initialOwner, data, customDataProxy)) };

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
        return inst;
    };
}
