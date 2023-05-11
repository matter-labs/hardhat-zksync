import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-web3';
import chalk from 'chalk';

import { BeaconProxyUnsupportedError } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { DeployTransaction, deploy } from './deploy';
import { deployProxyImpl } from './deploy-impl';
import { getInitializerData } from '../utils/utils-general';
import { ERC1967_PROXY_JSON, TUP_JSON } from '../constants';
import { Manifest, ProxyDeployment } from '../core/manifest';
import { DeployProxyOptions } from '../utils/options';
import assert from 'assert';

export interface DeployFunction {
    (wallet: zk.Wallet, artifact: ZkSyncArtifact, args?: unknown[], opts?: DeployProxyOptions): Promise<zk.Contract>;
}

export function makeDeployProxy(hre: HardhatRuntimeEnvironment): DeployFunction {
    return async function deployProxy(
        wallet,
        artifact,
        args: unknown[] | DeployProxyOptions = [],
        opts: DeployProxyOptions = {}
    ) {
        if (!Array.isArray(args)) {
            opts = args;
            args = [];
        }
        opts.provider = wallet.provider;

        const manifest = await Manifest.forNetwork(wallet.provider);

        const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);
        const { impl, kind } = await deployProxyImpl(hre, factory, opts);
        console.info(chalk.green('Implementation contract was deployed to ' + impl));

        const contractInterface = factory.interface;
        const data = getInitializerData(contractInterface, args, opts.initializer);

        if (kind === 'uups') {
            if (await manifest.getAdmin()) {
                console.info(
                    chalk.yellow(`A proxy admin was previously deployed on this network`, [
                        `This is not natively used with the current kind of proxy ('uups').`,
                        `Changes to the admin will have no effect on this new proxy.`,
                    ])
                );
            }
        }

        let proxyDeployment: Required<ProxyDeployment & DeployTransaction>;
        switch (kind) {
            case 'beacon': {
                throw new BeaconProxyUnsupportedError();
            }

            case 'uups': {
                const ERC1967ProxyPaths = (await hre.artifacts.getArtifactPaths()).filter((x) =>
                    x.includes(ERC1967_PROXY_JSON)
                );
                assert(ERC1967ProxyPaths.length === 1, 'ERC1967Proxy artifact not found');
                const proxyContract = await import(ERC1967ProxyPaths[0]);
                const proxyFactory = new zk.ContractFactory(proxyContract.abi, proxyContract.bytecode, wallet);
                proxyDeployment = Object.assign({ kind }, await deploy(proxyFactory, impl, data));
                break;
            }

            case 'transparent': {
                const adminAddress = await hre.zkUpgrades.deployProxyAdmin(wallet, {});
                console.info(chalk.green('Admin was deployed to ' + adminAddress));

                const TUPPaths = (await hre.artifacts.getArtifactPaths()).filter((x) => x.includes(TUP_JSON));
                assert(TUPPaths.length === 1, 'TUP artifact not found');
                const TUPContract = await import(TUPPaths[0]);

                const TUPFactory = new zk.ContractFactory(TUPContract.abi, TUPContract.bytecode, wallet);
                proxyDeployment = Object.assign({ kind }, await deploy(TUPFactory, impl, adminAddress, data));
                console.info(chalk.green(`Transparent proxy was deployed to ${proxyDeployment.address}`));

                break;
            }

            default: {
                throw new Error(`Unknown proxy kind: ${kind}`);
            }
        }

        await manifest.addProxy(proxyDeployment);
        const inst = factory.attach(proxyDeployment.address);
        // @ts-ignore Won't be readonly because inst was created through attach.
        inst.deployTransaction = proxyDeployment.deployTransaction;
        return inst;
    };
}
