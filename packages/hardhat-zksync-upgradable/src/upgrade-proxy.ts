import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers, ContractFactory, Contract, Signer } from 'ethers';

import { Manifest, getAdminAddress, getCode, isEmptySlot } from '@openzeppelin/upgrades-core';
import { ContractAddressOrInstance } from './interfaces';
import { UpgradeProxyOptions } from './options';
import { getContractAddress } from './contract-types';
import { deployProxyImpl } from './deploy-impl';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import fs from 'fs';
import * as zk from 'zksync-web3';
import * as zksync from 'zksync';

import { getProxyAdminFactory, getTransparentUpgradeableProxyFactory } from './utils/factories';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/dist/types';
import { Provider } from 'zksync-web3';

// import {
//     UpgradeProxyOptions,
//     deployProxyImpl,
//     getTransparentUpgradeableProxyFactory,
//     getProxyAdminFactory,
//     getContractAddress,
//     ContractAddressOrInstance,
// } from '@openzeppelin/hardhat-upgrades/src/utils';

export type UpgradeFunction = (
    deployer: Deployer,
    proxy: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    opts?: UpgradeProxyOptions
) => Promise<Contract>;

export function makeUpgradeProxy(hre: HardhatRuntimeEnvironment): UpgradeFunction {
    return async function upgradeProxy(deployer, proxy, artifact, opts: UpgradeProxyOptions = {}) {
        const proxyAddress = getContractAddress(proxy);

        // FIXME: Change this in production version
        const PRIVATE_KEY = fs.readFileSync('.secret').toString();
        // const syncProvider = new ethers.providers.JsonRpcProvider('https://zksync2-testnet.zksync.dev');
        // const syncProvider = await zksync.getDefaultProvider('https://zksync2-testnet.zksync.dev');
        // const provider = new Provider('https://zksync2-testnet.zksync.dev');

        const factory = new zk.ContractFactory(
            artifact.abi,
            artifact.bytecode,
            deployer.zkWallet,
            deployer.deploymentType
        );

        const { impl: nextImpl } = await deployProxyImpl(hre, artifact, factory, deployer, opts, proxyAddress);
        // const nextImpl = '0x71dB1C789F402D3388619D95c73e81cbC27F3418';

        // upgrade kind is inferred above
        const upgradeTo = await getUpgrader(proxyAddress, factory.signer);
        const call = encodeCall(factory, opts.call);
        const upgradeTx = await upgradeTo(nextImpl, call);

        console.log('Contract successfully upgraded to ', nextImpl, ' with tx ', upgradeTx.hash);

        const inst = factory.attach(proxyAddress);
        // @ts-ignore Won't be readonly because inst was created through attach.
        inst.deployTransaction = upgradeTx;
        return inst;
    };

    type Upgrader = (nextImpl: string, call?: string) => Promise<ethers.providers.TransactionResponse>;

    async function getUpgrader(proxyAddress: string, signer: Signer): Promise<Upgrader> {
        const { provider } = hre.network;

        const adminAddress = await getAdminAddress(provider, proxyAddress);
        const adminBytecode = await getCode(provider, adminAddress);

        if (isEmptySlot(adminAddress) || adminBytecode === '0x') {
            // No admin contract: use TransparentUpgradeableProxyFactory to get proxiable interface
            const TransparentUpgradeableProxyFactory = await getTransparentUpgradeableProxyFactory(hre, signer);
            const proxy = TransparentUpgradeableProxyFactory.attach(proxyAddress);

            return (nextImpl, call) => (call ? proxy.upgradeToAndCall(nextImpl, call) : proxy.upgradeTo(nextImpl));
        } else {
            // Admin contract: redirect upgrade call through it
            const manifest = await Manifest.forNetwork(provider);
            const AdminFactory = await getProxyAdminFactory(hre, signer);
            const admin = AdminFactory.attach(adminAddress);
            const manifestAdmin = await manifest.getAdmin();

            if (admin.address !== manifestAdmin?.address) {
                throw new Error('Proxy admin is not the one registered in the network manifest');
            }

            return (nextImpl, call) =>
                call ? admin.upgradeAndCall(proxyAddress, nextImpl, call) : admin.upgrade(proxyAddress, nextImpl);
        }
    }
}

function encodeCall(factory: ContractFactory, call: UpgradeProxyOptions['call']): string | undefined {
    if (!call) {
        return undefined;
    }

    if (typeof call === 'string') {
        call = { fn: call };
    }

    return factory.interface.encodeFunctionData(call.fn, call.args ?? []);
}
