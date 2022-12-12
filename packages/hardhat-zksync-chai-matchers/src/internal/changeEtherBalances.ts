import type { BigNumberish, ethers } from 'ethers';
import * as zk from 'zksync-web3';
import ordinal from 'ordinal';

import { buildAssert } from '@nomicfoundation/hardhat-chai-matchers/utils';

import { getAddressOf, Account } from './misc/account';
import { BalanceChangeOptions, getAddresses, getBalances } from './misc/balance';

export function supportChangeEtherBalances(Assertion: Chai.AssertionStatic) {
    Assertion.addMethod(
        'changeEtherBalances',
        function (
            this: any,
            accounts: Array<Account | string>,
            balanceChanges: BigNumberish[],
            options?: {
                balanceChangeOptions?: BalanceChangeOptions;
                overrides?: ethers.Overrides;
            }
        ) {
            const { BigNumber } = require('ethers');

            const negated = this.__flags.negate;

            let subject = this._obj;
            if (typeof subject === 'function') {
                subject = subject();
            }

            const checkBalanceChanges = ([actualChanges, accountAddresses]: [Array<typeof BigNumber>, string[]]) => {
                const assert = buildAssert(negated, checkBalanceChanges);

                assert(
                    actualChanges.every((change, ind) => change.eq(BigNumber.from(balanceChanges[ind]))),
                    () => {
                        const lines: string[] = [];
                        actualChanges.forEach((change, i) => {
                            if (!change.eq(BigNumber.from(balanceChanges[i]))) {
                                lines.push(
                                    `Expected the ether balance of ${accountAddresses[i]} (the ${ordinal(
                                        i + 1
                                    )} address in the list) to change by ${balanceChanges[
                                        i
                                    ].toString()} wei, but it changed by ${change.toString()} wei`
                                );
                            }
                        });
                        return lines.join('\n');
                    },
                    () => {
                        const lines: string[] = [];
                        actualChanges.forEach((change, i) => {
                            if (change.eq(BigNumber.from(balanceChanges[i]))) {
                                lines.push(
                                    `Expected the ether balance of ${accountAddresses[i]} (the ${ordinal(
                                        i + 1
                                    )} address in the list) NOT to change by ${balanceChanges[
                                        i
                                    ].toString()} wei, but it did`
                                );
                            }
                        });
                        return lines.join('\n');
                    }
                );
            };

            const derivedPromise = Promise.all([
                getBalanceChanges(subject, accounts, options?.balanceChangeOptions, options?.overrides),
                getAddresses(accounts),
            ]).then(checkBalanceChanges);
            this.then = derivedPromise.then.bind(derivedPromise);
            this.catch = derivedPromise.catch.bind(derivedPromise);
            this.promise = derivedPromise;
            return this;
        }
    );
}

export async function getBalanceChanges(
    transaction: zk.types.TransactionResponse | Promise<zk.types.TransactionResponse>,
    accounts: Array<Account | string>,
    options?: BalanceChangeOptions,
    overrides?: ethers.Overrides
) {
    const txResponse = await transaction;

    const txReceipt = await txResponse.wait();
    const txBlockNumber = txReceipt.blockNumber;

    const balancesAfter = await getBalances(accounts, txBlockNumber);
    const balancesBefore = await getBalances(accounts, txBlockNumber - 1);

    const txFees = await getTxFees(accounts, txResponse, options, overrides);

    return balancesAfter.map((balance, ind) => balance.add(txFees[ind]).sub(balancesBefore[ind]));
}

async function getTxFees(
    accounts: Array<Account | string>,
    txResponse: zk.types.TransactionResponse,
    options?: BalanceChangeOptions,
    overrides?: ethers.Overrides
) {
    const { BigNumber } = require('ethers');
    const provider = zk.Provider.getDefaultProvider();

    return Promise.all(
        accounts.map(async (account) => {
            if (options?.includeFee !== true && (await getAddressOf(account)) === txResponse.from) {
                const gasPrice = overrides?.maxFeePerGas
                    ? BigNumber.from(overrides?.maxFeePerGas)
                    : await provider.getGasPrice();
                const gasUsed = await provider.estimateGas(txResponse as zk.types.TransactionRequest);
                const txFee = gasPrice.mul(gasUsed);

                return txFee;
            }

            return 0;
        })
    );
}
