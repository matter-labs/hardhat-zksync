import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-web3';
import chalk from 'chalk';

import { BeaconProxyUnsupportedError } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { DeployTransaction, deploy } from './deploy';
import { deployProxyImpl } from './deploy-impl';
import { importProxyContract, getInitializerData } from '../utils/utils-general';
import { ERC1967_PROXY_JSON, TUP_JSON } from '../constants';
import { Manifest, ProxyDeployment } from '../core/manifest';
import { DeployProxyOptions } from '../utils/options';

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
        console.log('Implementation contract was deployed to ' + impl);

        const contractInterface = factory.interface;
        const data = getInitializerData(contractInterface, args, opts.initializer);

        if (kind === 'uups') {
            if (await manifest.getAdmin()) {
                console.log(
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
                const proxyContract = await importProxyContract('..', hre.config.zksolc.version, ERC1967_PROXY_JSON);
                const proxyFactory = new zk.ContractFactory(proxyContract.abi, proxyContract.bytecode, wallet);

                proxyDeployment = Object.assign({ kind }, await deploy(proxyFactory, impl, data));
                break;
            }

            case 'transparent': {
                const adminAddress = await hre.zkUpgrades.deployProxyAdmin(wallet, {});
                console.log('Admin was deployed to ' + adminAddress);

                const TUPContract = await importProxyContract('..', hre.config.zksolc.version, TUP_JSON);

                const TUPFactory = new zk.ContractFactory(TUPContract.abi, TUPContract.bytecode, wallet);
                proxyDeployment = Object.assign({ kind }, await deploy(TUPFactory, impl, adminAddress, data));
                console.log(`Transparent proxy was deployed to ${proxyDeployment.address}`);

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
