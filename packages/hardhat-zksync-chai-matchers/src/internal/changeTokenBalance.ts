import * as zk from 'zksync2-js';

import { buildAssert } from '@nomicfoundation/hardhat-chai-matchers/utils';
import { ensure } from '@nomicfoundation/hardhat-chai-matchers/internal/calledOnContract/utils';

import { Account, getAddressOf } from './misc/account';

interface Token extends zk.Contract {
    balanceOf(address: string, overrides?: any): Promise<bigint>;
}

export function supportChangeTokenBalance(Assertion: Chai.AssertionStatic) {
    Assertion.addMethod(
        'changeTokenBalance',
        function (this: any, token: Token, account: Account | string, balanceChange: bigint) {

            const negated = this.__flags.negate;

            let subject = this._obj;
            if (typeof subject === 'function') {
                subject = subject();
            }

            checkToken(token, 'changeTokenBalance');

            const checkBalanceChange = ([actualChange, address, tokenDescription]: [bigint, string, string]) => {
                const assert = buildAssert(negated, checkBalanceChange);

                assert(
                    actualChange===balanceChange,
                    `Expected the balance of ${tokenDescription} tokens for "${address}" to change by ${balanceChange.toString()}, but it changed by ${actualChange.toString()}`,
                    `Expected the balance of ${tokenDescription} tokens for "${address}" NOT to change by ${balanceChange.toString()}, but it did`
                );
            };

            const derivedPromise = Promise.all([
                getBalanceChange(subject, token, account),
                getAddressOf(account),
                getTokenDescription(token),
            ]).then(value => checkBalanceChange(value as [bigint,string, string]));

            this.then = derivedPromise.then.bind(derivedPromise);
            this.catch = derivedPromise.catch.bind(derivedPromise);

            return this;
        }
    );

    Assertion.addMethod(
        'changeTokenBalances',
        function (this: any, token: Token, accounts: Array<Account | string>, balanceChanges: bigint[]) {
            const negated = this.__flags.negate;

            let subject = this._obj;
            if (typeof subject === 'function') {
                subject = subject();
            }

            checkToken(token, 'changeTokenBalances');

            if (accounts.length !== balanceChanges.length) {
                throw new Error(
                    `The number of accounts (${accounts.length}) is different than the number of expected balance changes (${balanceChanges.length})`
                );
            }

            const balanceChangesPromise = Promise.all(
                accounts.map((account) => getBalanceChange(subject, token, account))
            );
            const addressesPromise = Promise.all(accounts.map(getAddressOf));

            const checkBalanceChanges = ([actualChanges, addresses, tokenDescription]: [
                bigint[],
                string[],
                string
            ]) => {
                const assert = buildAssert(negated, checkBalanceChanges);

                assert(
                    actualChanges.every((change, ind) => change===balanceChanges[ind]),
                    `Expected the balances of ${tokenDescription} tokens for ${addresses as any} to change by ${
                        balanceChanges as any
                    }, respectively, but they changed by ${actualChanges as any}`,
                    `Expected the balances of ${tokenDescription} tokens for ${addresses as any} NOT to change by ${
                        balanceChanges as any
                    }, respectively, but they did`
                );
            };

            const derivedPromise = Promise.all([
                balanceChangesPromise,
                addressesPromise,
                getTokenDescription(token),
            ]).then(value => checkBalanceChanges(value as [bigint[],string[], string]));

            this.then = derivedPromise.then.bind(derivedPromise);
            this.catch = derivedPromise.catch.bind(derivedPromise);

            return this;
        }
    );
}

function checkToken(token: unknown, method: string) {
    if (typeof token !== 'object' || token === null || !('functions' in token)) {
        throw new Error(`The first argument of ${method} must be the contract instance of the token`);
    } else if ((token as any).functions.balanceOf === undefined) {
        throw new Error('The given contract instance is not an ERC20 token');
    }
}

export async function getBalanceChange(
    transaction: zk.types.TransactionResponse | Promise<zk.types.TransactionResponse>,
    token: Token,
    account: Account | string
) {
    const { BigNumber } = require('ethers');
    const provider = zk.Provider.getDefaultProvider()!;

    const txResponse = await transaction;

    const txReceipt = await txResponse.wait();
    const txBlockNumber = txReceipt.blockNumber;

    const block = await provider.send('eth_getBlockByHash', [txReceipt.blockHash, false]);

    ensure(block.transactions.length === 1, Error, 'Multiple transactions found in block');

    const address = await getAddressOf(account);
    const tokenAddress = await token.getAddress();

    const balanceAfter = await provider.getBalance(address as string, txBlockNumber, tokenAddress);
    const balanceBefore = await provider.getBalance(address as string, txBlockNumber - 1, tokenAddress);

    return balanceAfter-balanceBefore;
}

let tokenDescriptionsCache: Record<string, string> = {};
/**
 * Get a description for the given token. Use the symbol of the token if
 * possible; if it doesn't exist, the name is used; if the name doesn't
 * exist, the address of the token is used.
 */
async function getTokenDescription(token: Token): Promise<string> {
    const tokenAddress = await token.getAddress();

    if (tokenDescriptionsCache[tokenAddress] === undefined) {
        let tokenDescription = `<token at ${tokenAddress}>`;
        try {
            tokenDescription = await token.symbol();
        } catch (e) {
            try {
                tokenDescription = await token.name();
            } catch (e2) {}
        }

        tokenDescriptionsCache[tokenAddress] = tokenDescription;
    }

    return tokenDescriptionsCache[tokenAddress];
}

// only used by tests
export function clearTokenDescriptionsCache() {
    tokenDescriptionsCache = {};
}
