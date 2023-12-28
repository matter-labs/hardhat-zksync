import chalk from 'chalk';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getAdminAddress } from '@openzeppelin/upgrades-core';
import { Wallet, Contract } from 'zksync-ethers';
import { Manifest } from './core/manifest';
import { getAdminFactory } from './proxy-deployment/deploy-proxy-admin';
import { ZkSyncUpgradablePluginError } from './errors';

export type ChangeAdminFunction = (proxyAddress: string, newAdmin: string, wallet: Wallet) => Promise<void>;
export type TransferProxyAdminOwnershipFunction = (newOwner: string, wallet: Wallet) => Promise<void>;
export type GetInstanceFunction = (wallet: Wallet) => Promise<Contract>;

export function makeChangeProxyAdmin(hre: HardhatRuntimeEnvironment): ChangeAdminFunction {
    return async function changeProxyAdmin(proxyAddress, newAdmin, wallet: Wallet) {
        const proxyAdminManifest = await getManifestAdmin(hre, wallet);

        const proxyAdminAddress = await getAdminAddress(wallet.provider, proxyAddress);

        if ((await proxyAdminManifest.getAddress()) !== proxyAdminAddress) {
            throw new ZkSyncUpgradablePluginError('Proxy admin is not the one registered in the network manifest');
        } else if ((await proxyAdminManifest.getAddress()) !== newAdmin) {
            await proxyAdminManifest.changeProxyAdmin(proxyAddress, newAdmin);
        }
    };
}

export function makeTransferProxyAdminOwnership(hre: HardhatRuntimeEnvironment): TransferProxyAdminOwnershipFunction {
    return async function transferProxyAdminOwnership(newOwner, wallet: Wallet) {
        const admin = await getManifestAdmin(hre, wallet);

        await admin.transferOwnership(newOwner);

        const manifest = await Manifest.forNetwork(wallet.provider);
        const { proxies } = await manifest.read();
        for (const { address, kind } of proxies) {
            if ((await admin.getAddress()) === (await getAdminAddress(wallet.provider, address))) {
                console.info(chalk.green(`${address} (${kind}) proxy ownership transfered through admin proxy`));
            } else {
                console.info(chalk.red(`${address} (${kind}) proxy ownership not affected by admin proxy`));
            }
        }
    };
}

export function makeGetInstanceFunction(hre: HardhatRuntimeEnvironment): GetInstanceFunction {
    return async function getInstance(wallet: Wallet) {
        return await getManifestAdmin(hre, wallet);
    };
}

export async function getManifestAdmin(hre: HardhatRuntimeEnvironment, wallet: Wallet): Promise<Contract> {
    const manifest = await Manifest.forNetwork(wallet.provider);
    const manifestAdmin = await manifest.getAdmin();
    const proxyAdminAddress = manifestAdmin?.address;

    if (proxyAdminAddress === undefined) {
        throw new ZkSyncUpgradablePluginError('No ProxyAdmin was found in the network manifest');
    }

    const adminFactory = await getAdminFactory(hre, wallet);
    return adminFactory.attach(proxyAdminAddress);
}
