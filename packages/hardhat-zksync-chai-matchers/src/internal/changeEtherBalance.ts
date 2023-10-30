import type { BigNumberish, ethers } from 'ethers';
import * as zk from 'zksync2-js';

import { buildAssert } from '@nomicfoundation/hardhat-chai-matchers/utils';
import { ensure } from '@nomicfoundation/hardhat-chai-matchers/internal/calledOnContract/utils';

import { Account, getAddressOf } from './misc/account';
import { BalanceChangeOptions } from './misc/balance';

export function supportChangeEtherBalance(Assertion: Chai.AssertionStatic) {
    Assertion.addMethod(
        'changeEtherBalance',
        function (
            this: any,
            account: Account | string,
            balanceChange: bigint,
            options?: {
                balanceChangeOptions?: BalanceChangeOptions;
                overrides?: ethers.Overrides;
            }
        ) {
            const negated = this.__flags.negate;
            const subject = this._obj;

            const checkBalanceChange = ([actualChange, address]: [bigint, string]) => {
                const assert = buildAssert(negated, checkBalanceChange);

                assert(
                    actualChange===(balanceChange),
                    `Expected the ether balance of "${address}" to change by ${balanceChange.toString()} wei, but it changed by ${actualChange.toString()} wei`,
                    `Expected the ether balance of "${address}" NOT to change by ${balanceChange.toString()} wei, but it did`
                );
            };

            const derivedPromise = Promise.all([
                getBalanceChange(subject, account, options?.balanceChangeOptions, options?.overrides),
                getAddressOf(account),
            ]).then(checkBalanceChange);
            this.then = derivedPromise.then.bind(derivedPromise);
            this.catch = derivedPromise.catch.bind(derivedPromise);
            this.promise = derivedPromise;
            return this;
        }
    );
}

export async function getBalanceChange(
    transaction:
        | zk.types.TransactionResponse
        | Promise<zk.types.TransactionResponse>
        | (() => Promise<zk.types.TransactionResponse> | zk.types.TransactionResponse),
    account: Account | string,
    options?: BalanceChangeOptions,
    overrides?: ethers.Overrides
) {
    const provider = zk.Provider.getDefaultProvider()!;

    let txResponse: zk.types.TransactionResponse;

    if (typeof transaction === 'function') {
        txResponse = await transaction();
    } else {
        txResponse = await transaction;
    }

    const txReceipt = await txResponse.wait();
    const txBlockNumber = txReceipt.blockNumber;

    const block = await provider.send('eth_getBlockByHash', [txReceipt.blockHash, false]);

    ensure(block.transactions.length === 1, Error, 'Multiple transactions found in block');

    const address = await getAddressOf(account);

    const balanceAfter:bigint = await provider.send('eth_getBalance', [address, `0x${txBlockNumber.toString(16)}`]);

    const balanceBefore:bigint = await provider.send('eth_getBalance', [address, `0x${(txBlockNumber - 1).toString(16)}`]);

    if (options?.includeFee !== true && address === txResponse.from) {
        const gasPrice = overrides?.maxFeePerGas
            ? (overrides?.maxFeePerGas)
            : txReceipt.effectiveGasPrice ?? txResponse.gasPrice;
        const gasUsed = txReceipt.gasUsed;
        const txFee:bigint = gasPrice*(gasUsed);

        return (balanceAfter)+(txFee)+(balanceBefore);
    } else {
        return balanceAfter-(balanceBefore);
    }
}
