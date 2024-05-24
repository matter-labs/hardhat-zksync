import { getAdminAddress } from '@openzeppelin/upgrades-core';
import { Wallet, Contract } from 'zksync-ethers';
import { attachProxyAdminV4 } from './utils/attach-abi';

export type ChangeAdminFunction = (proxyAddress: string, newAdmin: string, wallet: Wallet) => Promise<void>;
export type TransferProxyAdminOwnershipFunction = (
    proxyAddress: string,
    newOwner: string,
    wallet: Wallet,
) => Promise<void>;
export type GetInstanceFunction = (wallet: Wallet) => Promise<Contract>;

export function makeChangeProxyAdmin(): ChangeAdminFunction {
    return async function changeProxyAdmin(proxyAddress, newAdmin, wallet: Wallet) {
        const proxyAdminAddress = await getAdminAddress(wallet.provider, proxyAddress);

        const admin = await attachProxyAdminV4(proxyAdminAddress, wallet);
        await admin.changeProxyAdmin(proxyAddress, newAdmin);
    };
}

export function makeTransferProxyAdminOwnership(): TransferProxyAdminOwnershipFunction {
    return async function transferProxyAdminOwnership(proxyAddress: string, newOwner: string, wallet: Wallet) {
        const proxyAdminAddress = await getAdminAddress(wallet.provider, proxyAddress);
        const admin = await attachProxyAdminV4(proxyAdminAddress, wallet);
        await admin.transferOwnership(newOwner);
    };
}
