import assert from 'assert';
import type { Contract, Signer, Wallet } from 'zksync-ethers';

export type Account = Signer | Wallet | Contract;

export function isWalletOrContract(account: Account): account is Contract | Wallet {
    const zk = require('zksync-ethers');
    return account instanceof zk.Contract || account instanceof zk.Wallet;
}

export async function getAddressOf(account: Account | string) {
    if (typeof account === 'string') {
        assert(/^0x[0-9a-fA-F]{40}$/.test(account), `Invalid address ${account}`);
        return account;
    } else if (isWalletOrContract(account)) {
        return account.address;
    } else {
        return account.getAddress();
    }
}
