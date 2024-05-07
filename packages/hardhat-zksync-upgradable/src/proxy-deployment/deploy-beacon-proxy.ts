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
import assert from 'assert';
import path from 'path';
import { ContractAddressOrInstance, getContractAddress, getInitializerData } from '../utils/utils-general';
import { DeployBeaconProxyOptions } from '../utils/options';
import { BEACON_PROXY_JSON } from '../constants';
import { ZkSyncUpgradablePluginError } from '../errors';
import { Manifest } from '../core/manifest';
import { deploy, DeployTransaction } from './deploy';

export interface DeployBeaconProxyFunction {
    (
        wallet: zk.Wallet,
        beacon: ContractAddressOrInstance,
        artifact: ZkSyncArtifact,
        args?: unknown[],
        opts?: DeployBeaconProxyOptions,
        quiet?: boolean,
    ): Promise<zk.Contract>;
    (
        wallet: zk.Wallet,
        beacon: ContractAddressOrInstance,
        artifact: ZkSyncArtifact,
        opts?: DeployBeaconProxyOptions,
    ): Promise<zk.Contract>;
}

export function makeDeployBeaconProxy(hre: HardhatRuntimeEnvironment): DeployBeaconProxyFunction {
    return async function deployBeaconProxy(
        wallet: zk.Wallet,
        beacon: ContractAddressOrInstance,
        artifact: ZkSyncArtifact,
        args: unknown[] | DeployBeaconProxyOptions = [],
        opts: DeployBeaconProxyOptions = {},
        quiet: boolean = false,
    ) {
        const attachTo = new zk.ContractFactory<any[], zk.Contract>(artifact.abi, artifact.bytecode, wallet);

        if (!(attachTo instanceof zk.ContractFactory)) {
            throw new ZkSyncUpgradablePluginError(
                `attachTo must specify a contract factory\n` +
                    `Include the contract factory for the beacon's current implementation in the attachTo parameter`,
            );
        }
        if (!Array.isArray(args)) {
            opts = args;
            args = [];
        }

        const manifest = await Manifest.forNetwork(wallet.provider);

        if (opts.kind !== undefined && opts.kind !== 'beacon') {
            throw new DeployBeaconProxyKindError(opts.kind);
        }
        opts.kind = 'beacon';

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

        const beaconProxyPath = (await hre.artifacts.getArtifactPaths()).find((artifactPath) =>
            artifactPath.includes(path.sep + BEACON_PROXY_JSON),
        );
        assert(beaconProxyPath, 'Beacon proxy artifact not found');
        const beaconProxyContract = await import(beaconProxyPath);

        const beaconProxyFactory = new zk.ContractFactory<any[], zk.Contract>(
            beaconProxyContract.abi,
            beaconProxyContract.bytecode,
            wallet,
            opts.deploymentType,
        );

        const proxyDeployment: Required<ProxyDeployment & DeployTransaction> = {
            kind: opts.kind,
            ...(await deploy(beaconProxyFactory, beaconAddress, data, {
                customData: {
                    salt: opts.salt,
                },
            })),
        };

        if (!quiet) {
            console.info(chalk.green('Beacon proxy deployed at: ', proxyDeployment.address));
        }

        await manifest.addProxy(proxyDeployment);

        const inst = attachTo.attach(proxyDeployment.address);
        // @ts-ignore Won't be readonly because inst was created through attach.
        inst.deployTransaction = proxyDeployment.deployTransaction;
        return inst;
    };
}
