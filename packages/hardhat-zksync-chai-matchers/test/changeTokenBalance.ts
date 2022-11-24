import assert from 'assert';
import { AssertionError, expect } from 'chai';
import { BigNumber } from 'ethers';
import * as zk from 'zksync-web3';
import path from 'path';
import util from 'util';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { clearTokenDescriptionsCache } from '../src/internal/changeTokenBalance';
import { useEnvironmentWithLocalSetup } from './helpers';
import '../src/internal/add-chai-matchers';

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('INTEGRATION: changeTokenBalance and changeTokenBalances matchers', function () {
    describe('with the local setup', function () {
        useEnvironmentWithLocalSetup('hardhat-project');

        runTests();
    });

    afterEach(function () {
        clearTokenDescriptionsCache();
    });

    function runTests() {
        let sender: zk.Wallet;
        let receiver: zk.Wallet;
        let provider: zk.Provider;
        let deployer: Deployer;
        let artifact: ZkSyncArtifact;
        let mockToken: zk.Contract;

        beforeEach(async function () {
            provider = zk.Provider.getDefaultProvider();
            sender = new zk.Wallet(RICH_WALLET_PK, provider);
            receiver = zk.Wallet.createRandom();

            deployer = new Deployer(this.hre, sender);
            artifact = await deployer.loadArtifact('MockToken');
            mockToken = await deployer.deploy(artifact);
        });

        describe("transaction that doesn't move tokens", () => {
            it('with a promise of a TxResponse', async function () {
                await runAllAsserts(
                    sender.sendTransaction({ to: receiver.address }),
                    mockToken,
                    [sender, receiver],
                    [0, 0]
                );
            });

            it('with a TxResponse', async function () {
                await runAllAsserts(
                    await sender.sendTransaction({
                        to: receiver.address,
                    }),
                    mockToken,
                    [sender, receiver],
                    [0, 0]
                );
            });

            it('with a function that returns a promise of a TxResponse', async function () {
                await runAllAsserts(
                    () => sender.sendTransaction({ to: receiver.address }),
                    mockToken,
                    [sender, receiver],
                    [0, 0]
                );
            });

            it('with a function that returns a TxResponse', async function () {
                const txResponse = await sender.sendTransaction({
                    to: receiver.address,
                });
                await runAllAsserts(() => txResponse, mockToken, [sender, receiver], [0, 0]);
            });

            it('accepts addresses', async function () {
                await expect(sender.sendTransaction({ to: receiver.address })).to.changeTokenBalance(
                    mockToken,
                    sender.address,
                    0
                );

                await expect(() => sender.sendTransaction({ to: receiver.address })).to.changeTokenBalances(
                    mockToken,
                    [sender.address, receiver.address],
                    [0, 0]
                );

                await expect(() => sender.sendTransaction({ to: receiver.address })).to.changeTokenBalances(
                    mockToken,
                    [sender.address, receiver],
                    [0, 0]
                );
            });

            it('negated', async function () {
                await expect(sender.sendTransaction({ to: receiver.address })).to.not.changeTokenBalance(
                    mockToken,
                    sender,
                    1
                );

                await expect(() => sender.sendTransaction({ to: receiver.address })).to.not.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [0, 1]
                );

                await expect(() => sender.sendTransaction({ to: receiver.address })).to.not.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [1, 0]
                );

                await expect(() => sender.sendTransaction({ to: receiver.address })).to.not.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [1, 1]
                );
            });

            describe('assertion failures', function () {
                it("doesn't change balance as expected", async function () {
                    await expect(
                        expect(sender.sendTransaction({ to: receiver.address })).to.changeTokenBalance(
                            mockToken,
                            sender,
                            1
                        )
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of MCK tokens for "0x\w{40}" to change by 1, but it changed by 0/
                    );
                });

                it("doesn't change balance as expected - zkSync transfer", async function () {
                    await expect(
                        expect(
                            sender.transfer({ to: receiver.address, amount: 2, token: mockToken.address })
                        ).to.changeTokenBalance(mockToken, sender, 1)
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of MCK tokens for "0x\w{40}" to change by 1, but it changed by -2/
                    );
                });

                it('changes balance in the way it was not expected', async function () {
                    await expect(
                        expect(sender.sendTransaction({ to: receiver.address })).to.not.changeTokenBalance(
                            mockToken,
                            sender,
                            0
                        )
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of MCK tokens for "0x\w{40}" NOT to change by 0, but it did/
                    );
                });

                it('changes balance in the way it was not expected - zkSync transfer', async function () {
                    await expect(
                        expect(
                            sender.transfer({ to: receiver.address, amount: 1, token: mockToken.address })
                        ).to.not.changeTokenBalance(mockToken, sender, -1)
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of MCK tokens for "0x\w{40}" NOT to change by -1, but it did/
                    );
                });

                it("the first account doesn't change its balance as expected", async function () {
                    await expect(
                        expect(sender.sendTransaction({ to: receiver.address })).to.changeTokenBalances(
                            mockToken,
                            [sender, receiver],
                            [1, 0]
                        )
                    ).to.be.rejectedWith(AssertionError);
                });

                it("the first account doesn't change its balance as expected - zkSync transfer", async function () {
                    await expect(
                        expect(
                            sender.transfer({ to: receiver.address, amount: 2, token: mockToken.address })
                        ).to.changeTokenBalances(mockToken, [sender, receiver], [1, 2])
                    ).to.be.rejectedWith(AssertionError);
                });

                it("the second account doesn't change its balance as expected", async function () {
                    await expect(
                        expect(sender.sendTransaction({ to: receiver.address })).to.changeTokenBalances(
                            mockToken,
                            [sender, receiver],
                            [0, 1]
                        )
                    ).to.be.rejectedWith(AssertionError);
                });

                it("the second account doesn't change its balance as expected - zkSync transfer", async function () {
                    await expect(
                        expect(
                            sender.transfer({ to: receiver.address, amount: 2, token: mockToken.address })
                        ).to.changeTokenBalances(mockToken, [sender, receiver], [-2, 1])
                    ).to.be.rejectedWith(AssertionError);
                });

                it('neither account changes its balance as expected', async function () {
                    await expect(
                        expect(sender.sendTransaction({ to: receiver.address })).to.changeTokenBalances(
                            mockToken,
                            [sender, receiver],
                            [1, 1]
                        )
                    ).to.be.rejectedWith(AssertionError);
                });

                it('neither account changes its balance as expected - zkSync transfer', async function () {
                    await expect(
                        expect(
                            sender.transfer({ to: receiver.address, amount: 2, token: mockToken.address })
                        ).to.changeTokenBalances(mockToken, [sender, receiver], [1, 1])
                    ).to.be.rejectedWith(AssertionError);
                });

                it('accounts change their balance in the way it was not expected', async function () {
                    await expect(
                        expect(sender.sendTransaction({ to: receiver.address })).to.not.changeTokenBalances(
                            mockToken,
                            [sender, receiver],
                            [0, 0]
                        )
                    ).to.be.rejectedWith(AssertionError);
                });

                it('accounts change their balance in the way it was not expected - zkSync transfer', async function () {
                    await expect(
                        expect(
                            sender.transfer({ to: receiver.address, amount: 2, token: mockToken.address })
                        ).to.not.changeTokenBalances(mockToken, [sender, receiver], [-2, 2])
                    ).to.be.rejectedWith(AssertionError);
                });
            });
        });

        describe('transaction that transfers some tokens', function () {
            it('with a promise of a TxResponse', async function () {
                await runAllAsserts(mockToken.transfer(receiver.address, 50), mockToken, [sender, receiver], [-50, 50]);

                await runAllAsserts(
                    mockToken.transfer(receiver.address, 100),
                    mockToken,
                    [sender, receiver],
                    [-100, 100]
                );
            });

            it('with a TxResponse', async function () {
                await runAllAsserts(
                    await mockToken.transfer(receiver.address, 150),
                    mockToken,
                    [sender, receiver],
                    [-150, 150]
                );
            });

            it('with a function that returns a promise of a TxResponse', async function () {
                await runAllAsserts(
                    () => mockToken.transfer(receiver.address, 200),
                    mockToken,
                    [sender, receiver],
                    [-200, 200]
                );
            });

            it('with a function that returns a TxResponse', async function () {
                const txResponse = await mockToken.transfer(receiver.address, 300);
                await runAllAsserts(() => txResponse, mockToken, [sender, receiver], [-300, 300]);
            });

            it("changeTokenBalance shouldn't run the transaction twice", async function () {
                const receiverBalanceBefore = await mockToken.balanceOf(receiver.address);

                await expect(() => mockToken.transfer(receiver.address, 50)).to.changeTokenBalance(
                    mockToken,
                    receiver,
                    50
                );

                const receiverBalanceChange = (await mockToken.balanceOf(receiver.address)).sub(receiverBalanceBefore);

                expect(receiverBalanceChange.toNumber()).to.equal(50);
            });

            it("changeTokenBalances shouldn't run the transaction twice", async function () {
                const receiverBalanceBefore = await mockToken.balanceOf(receiver.address);

                await expect(() => mockToken.transfer(receiver.address, 50)).to.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [-50, 50]
                );

                const receiverBalanceChange = (await mockToken.balanceOf(receiver.address)).sub(receiverBalanceBefore);

                expect(receiverBalanceChange.toNumber()).to.equal(50);
            });

            it('negated', async function () {
                await expect(mockToken.transfer(receiver.address, 50)).to.not.changeTokenBalance(mockToken, sender, 0);
                await expect(mockToken.transfer(receiver.address, 50)).to.not.changeTokenBalance(mockToken, sender, 1);

                await expect(mockToken.transfer(receiver.address, 50)).to.not.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [0, 0]
                );
                await expect(mockToken.transfer(receiver.address, 50)).to.not.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [-50, 0]
                );
                await expect(mockToken.transfer(receiver.address, 50)).to.not.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [0, 50]
                );
            });

            describe('assertion failures', function () {
                it("doesn't change balance as expected", async function () {
                    await expect(
                        expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalance(mockToken, receiver, 500)
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of MCK tokens for "0x\w{40}" to change by 500, but it changed by 50/
                    );
                });

                it('changes balance in the way it was not expected', async function () {
                    await expect(
                        expect(mockToken.transfer(receiver.address, 50)).to.not.changeTokenBalance(
                            mockToken,
                            receiver,
                            50
                        )
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of MCK tokens for "0x\w{40}" NOT to change by 50, but it did/
                    );
                });

                it("the first account doesn't change its balance as expected", async function () {
                    await expect(
                        expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalances(
                            mockToken,
                            [sender, receiver],
                            [-100, 50]
                        )
                    ).to.be.rejectedWith(AssertionError);
                });

                it("the second account doesn't change its balance as expected", async function () {
                    await expect(
                        expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalances(
                            mockToken,
                            [sender, receiver],
                            [-50, 100]
                        )
                    ).to.be.rejectedWith(AssertionError);
                });

                it('neither account changes its balance as expected', async function () {
                    await expect(
                        expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalances(
                            mockToken,
                            [sender, receiver],
                            [0, 0]
                        )
                    ).to.be.rejectedWith(AssertionError);
                });

                it('accounts change their balance in the way it was not expected', async function () {
                    await expect(
                        expect(mockToken.transfer(receiver.address, 50)).to.not.changeTokenBalances(
                            mockToken,
                            [sender, receiver],
                            [-50, 50]
                        )
                    ).to.be.rejectedWith(AssertionError);
                });

                it("uses the token name if the contract doesn't have a symbol", async function () {
                    const TokenWithOnlyNameArtifact = await deployer.loadArtifact('TokenWithOnlyName');
                    const tokenWithOnlyName = await deployer.deploy(TokenWithOnlyNameArtifact);

                    await expect(
                        expect(tokenWithOnlyName.transfer(receiver.address, 50)).to.changeTokenBalance(
                            tokenWithOnlyName,
                            receiver,
                            500
                        )
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of MockToken tokens for "0x\w{40}" to change by 500, but it changed by 50/
                    );

                    await expect(
                        expect(tokenWithOnlyName.transfer(receiver.address, 50)).to.not.changeTokenBalance(
                            tokenWithOnlyName,
                            receiver,
                            50
                        )
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of MockToken tokens for "0x\w{40}" NOT to change by 50, but it did/
                    );
                });

                it("uses the contract address if the contract doesn't have name or symbol", async function () {
                    const TokenWithoutNameNorSymbolArtifact = await deployer.loadArtifact('TokenWithoutNameNorSymbol');
                    const tokenWithoutNameNorSymbol = await deployer.deploy(TokenWithoutNameNorSymbolArtifact);

                    await expect(
                        expect(tokenWithoutNameNorSymbol.transfer(receiver.address, 50)).to.changeTokenBalance(
                            tokenWithoutNameNorSymbol,
                            receiver,
                            500
                        )
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of <token at 0x\w{40}> tokens for "0x\w{40}" to change by 500, but it changed by 50/
                    );

                    await expect(
                        expect(tokenWithoutNameNorSymbol.transfer(receiver.address, 50)).to.not.changeTokenBalance(
                            tokenWithoutNameNorSymbol,
                            receiver,
                            50
                        )
                    ).to.be.rejectedWith(
                        AssertionError,
                        /Expected the balance of <token at 0x\w{40}> tokens for "0x\w{40}" NOT to change by 50, but it did/
                    );
                });
            });
        });

        describe('accepted number types', function () {
            it('native bigints are accepted', async function () {
                await expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalance(
                    mockToken,
                    sender,
                    BigInt(-50)
                );

                await expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [BigInt(-50), BigInt(50)]
                );
            });

            it("ethers's bignumbers are accepted", async function () {
                await expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalance(
                    mockToken,
                    sender,
                    BigNumber.from(-50)
                );

                await expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [BigNumber.from(-50), BigNumber.from(50)]
                );
            });

            it('mixed types are accepted', async function () {
                await expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [BigInt(-50), BigNumber.from(50)]
                );

                await expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalances(
                    mockToken,
                    [sender, receiver],
                    [BigNumber.from(-50), BigInt(50)]
                );
            });
        });

        describe('stack traces', function () {
            describe('changeTokenBalance', function () {
                it('includes test file', async function () {
                    let hasProperStackTrace = false;
                    try {
                        await expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalance(
                            mockToken,
                            sender,
                            -100
                        );
                    } catch (e: any) {
                        hasProperStackTrace = util.inspect(e).includes(path.join('test', 'changeTokenBalance.ts'));
                    }

                    expect(hasProperStackTrace).to.equal(true);
                });
            });

            describe('changeTokenBalances', function () {
                it('includes test file', async function () {
                    try {
                        await expect(mockToken.transfer(receiver.address, 50)).to.changeTokenBalances(
                            mockToken,
                            [sender, receiver],
                            [-100, 100]
                        );
                    } catch (e: any) {
                        expect(util.inspect(e)).to.include(path.join('test', 'changeTokenBalance.ts'));

                        return;
                    }

                    expect.fail('Expected an exception but none was thrown');
                });
            });
        });
    }
});

function zip<T, U>(a: T[], b: U[]): Array<[T, U]> {
    assert(a.length === b.length);

    return a.map((x, i) => [x, b[i]]);
}

/**
 * Given an expression `expr`, a token, and a pair of arrays, check that
 * `changeTokenBalance` and `changeTokenBalances` behave correctly in different
 * scenarios.
 */
async function runAllAsserts(
    expr:
        | zk.types.TransactionResponse
        | Promise<zk.types.TransactionResponse>
        | (() => zk.types.TransactionResponse)
        | (() => Promise<zk.types.TransactionResponse>),
    token: zk.Contract,
    accounts: Array<string | zk.Wallet>,
    balances: Array<number | bigint | BigNumber>
) {
    await expect(expr).to.changeTokenBalances(token, accounts, balances);
    await expect(expr).to.changeTokenBalances(token, [], []);

    for (const [account, balance] of zip(accounts, balances)) {
        await expect(expr).to.changeTokenBalance(token, account, balance);
    }
}
