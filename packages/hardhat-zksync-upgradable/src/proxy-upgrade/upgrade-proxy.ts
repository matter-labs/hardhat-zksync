import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-web3';
import { TransactionResponse } from 'zksync-web3/src/types';

import { getAdminAddress, getCode, isEmptySlot } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { ContractAddressOrInstance } from '../interfaces';
import { UpgradeProxyOptions } from '../utils/options';
import { getContractAddress, importProxyContract } from '../utils/utils-general';
import { deployProxyImpl } from '../proxy-deployment/deploy-impl';
import { Manifest } from '../core/manifest';
import { PROXY_ADMIN_JSON, TUP_JSON } from '../constants';
import chalk from 'chalk';

export type UpgradeFunction = (
    wallet: zk.Wallet,
    proxy: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    opts?: UpgradeProxyOptions
) => Promise<zk.Contract>;

export function makeUpgradeProxy(hre: HardhatRuntimeEnvironment): UpgradeFunction {
    return async function upgradeProxy(wallet, proxy, newImplementationArtifact, opts: UpgradeProxyOptions = {}) {
        const proxyAddress = getContractAddress(proxy);
        opts.provider = wallet.provider;

        const newImplementationFactory = new zk.ContractFactory(
            newImplementationArtifact.abi,
            newImplementationArtifact.bytecode,
            wallet
        );
        const { impl: nextImpl } = await deployProxyImpl(hre, newImplementationFactory, opts, proxyAddress);

        const upgradeTo = await getUpgrader(proxyAddress, wallet);
        const call = encodeCall(newImplementationFactory, opts.call);
        const upgradeTx = await upgradeTo(nextImpl, call);

        console.info(chalk.green('Contract successfully upgraded to ', nextImpl, ' with tx ', upgradeTx.hash));

        const inst = newImplementationFactory.attach(proxyAddress);
        // @ts-ignore Won't be readonly because inst was created through attach.
        inst.deployTransaction = upgradeTx;
        return inst;
    };

    type Upgrader = (nextImpl: string, call?: string) => Promise<TransactionResponse>;

    async function getUpgrader(proxyAddress: string, wallet: zk.Wallet): Promise<Upgrader> {
        const provider = wallet.provider as zk.Provider;

        const adminAddress = await getAdminAddress(provider, proxyAddress);
        const adminBytecode = await getCode(provider, adminAddress);

        if (isEmptySlot(adminAddress) || adminBytecode === '0x') {
            const transparentUpgradeableProxyContract = await importProxyContract(
                '..',
                hre.config.zksolc.version,
                TUP_JSON
            );
            const transparentUpgradeableProxyFactory = new zk.ContractFactory(
                transparentUpgradeableProxyContract.abi,
                transparentUpgradeableProxyContract.bytecode,
                wallet
            );
            const proxy = transparentUpgradeableProxyFactory.attach(proxyAddress);

            return (nextImpl, call) => (call ? proxy.upgradeToAndCall(nextImpl, call) : proxy.upgradeTo(nextImpl));
        } else {
            const manifest = await Manifest.forNetwork(provider);

            const proxyAdminContract = await importProxyContract('..', hre.config.zksolc.version, PROXY_ADMIN_JSON);
            const proxyAdminFactory = new zk.ContractFactory(
                proxyAdminContract.abi,
                proxyAdminContract.bytecode,
                wallet
            );
            const admin = proxyAdminFactory.attach(adminAddress);
            const manifestAdmin = await manifest.getAdmin();

            if (admin.address !== manifestAdmin?.address) {
                throw new Error('Proxy admin is not the one registered in the network manifest');
            }

            return (nextImpl, call) =>
                call ? admin.upgradeAndCall(proxyAddress, nextImpl, call) : admin.upgrade(proxyAddress, nextImpl);
        }
    }
}

function encodeCall(factory: zk.ContractFactory, call: UpgradeProxyOptions['call']): string | undefined {
    if (!call) {
        return undefined;
    }

    if (typeof call === 'string') {
        call = { fn: call };
    }

    return factory.interface.encodeFunctionData(call.fn, call.args ?? []);
}
