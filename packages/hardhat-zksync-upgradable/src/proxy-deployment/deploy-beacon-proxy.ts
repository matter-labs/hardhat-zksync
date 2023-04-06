import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Contract, ContractFactory } from 'ethers';

import {
    logWarning,
    ProxyDeployment,
    isBeacon,
    DeployBeaconProxyUnsupportedError,
    DeployBeaconProxyKindError,
    UpgradesError,
} from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-web3';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { ContractAddressOrInstance, getContractAddress } from '../utils/utils-general';
import { DeployBeaconProxyOptions } from '../utils/options';
import { getInitializerData } from '../utils/utils-general';
import { deploy, DeployTransaction } from './deploy';
import { importProxyContract } from '../utils/utils-general';
import { BEACON_PROXY_JSON } from '../constants';
import { Manifest } from '../core/manifest';

export interface DeployBeaconProxyFunction {
    (
        wallet: zk.Wallet,
        beacon: ContractAddressOrInstance,
        artifact: ZkSyncArtifact,
        args?: unknown[],
        opts?: DeployBeaconProxyOptions
    ): Promise<Contract>;
    (
        wallet: zk.Wallet,
        beacon: ContractAddressOrInstance,
        artifact: ZkSyncArtifact,
        opts?: DeployBeaconProxyOptions
    ): Promise<Contract>;
}

export function makeDeployBeaconProxy(hre: HardhatRuntimeEnvironment): DeployBeaconProxyFunction {
    return async function deployBeaconProxy(
        wallet: zk.Wallet,
        beacon: ContractAddressOrInstance,
        artifact: ZkSyncArtifact,
        args: unknown[] | DeployBeaconProxyOptions = [],
        opts: DeployBeaconProxyOptions = {}
    ) {
        const attachTo = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);

        if (!(attachTo instanceof ContractFactory)) {
            throw new UpgradesError(
                `attachTo must specify a contract factory`,
                () => `Include the contract factory for the beacon's current implementation in the attachTo parameter`
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

        const beaconAddress = getContractAddress(beacon);
        if (!(await isBeacon(wallet.provider, beaconAddress))) {
            throw new DeployBeaconProxyUnsupportedError(beaconAddress);
        }

        const data = getInitializerData(attachTo.interface, args, opts.initializer);

        if (await manifest.getAdmin()) {
            logWarning(`A proxy admin was previously deployed on this network`, [
                `This is not natively used with the current kind of proxy ('beacon').`,
                `Changes to the admin will have no effect on this new proxy.`,
            ]);
        }

        const beaconProxyContract = await importProxyContract('..', hre.config.zksolc.version, BEACON_PROXY_JSON);
        const beaconProxyFactory = new zk.ContractFactory(
            beaconProxyContract.abi,
            beaconProxyContract.bytecode,
            wallet
        );

        const proxyDeployment: Required<ProxyDeployment & DeployTransaction> = Object.assign(
            { kind: opts.kind },
            await deploy(beaconProxyFactory, beaconAddress, data)
        );
        console.log('Beacon proxy deployed at: ', proxyDeployment.address);

        await manifest.addProxy(proxyDeployment);

        const inst = attachTo.attach(proxyDeployment.address);
        // @ts-ignore Won't be readonly because inst was created through attach.
        inst.deployTransaction = proxyDeployment.deployTransaction;
        return inst;
    };
}
