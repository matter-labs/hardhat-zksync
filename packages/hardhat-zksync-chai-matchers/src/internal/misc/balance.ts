import * as zk from 'zksync-ethers';

import { Account, getAddressOf } from './account';
import { HttpNetworkConfig } from 'hardhat/types';
import { toBigInt } from 'ethers';

export interface BalanceChangeOptions {
    includeFee?: boolean;
}

export function getAddresses(accounts: Array<Account | string>) {
    return Promise.all(accounts.map((account) => getAddressOf(account)));
}

export async function getBalances(accounts: Array<Account | string>, blockNumber?: number) {
    const hre = await import("hardhat");
    const provider = new zk.Provider((hre.network.config as HttpNetworkConfig).url);

    return Promise.all(
        accounts.map(async (account) => {
            const address = await getAddressOf(account);
            const result = await provider.send('eth_getBalance', [address, `0x${blockNumber?.toString(16) ?? 0}`]);
            return toBigInt(result)
        })
    );
}
