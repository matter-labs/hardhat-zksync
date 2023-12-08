import assert from 'assert';
import type { Signer, Wallet,Contract } from 'zksync-ethers';
import { ZkSyncChaiMatchersPluginAssertionError } from '../../errors';

export type Account = Signer | Wallet | Contract;

export function isWalletOrContract(account: Account): account is Contract | Wallet {
    const zk = require('zksync-ethers');
    return account instanceof zk.Contract || account instanceof zk.Wallet;
}

export async function getAddressOf(account: Account | string):Promise<string> {
    const { isAddressable } = await import("ethers");

    if (typeof account === 'string') {
        assert(/^0x[0-9a-fA-F]{40}$/.test(account), `Invalid address ${account}`);
        return account;
    }
    
    if(isAddressable(account)) return await account.getAddress();
    
    throw new ZkSyncChaiMatchersPluginAssertionError(
        `Expected string or addressable, got ${account as any}`
    );
}
