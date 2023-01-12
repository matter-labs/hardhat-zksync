import { expect, AssertionError } from 'chai';
import { BigNumber } from 'ethers';
import * as zk from 'zksync-web3';
import path from 'path';
import util from 'util';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { useEnvironmentWithLocalSetup } from './helpers';
import '../src/internal/add-chai-matchers';

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('INTEGRATION: changeEtherBalances matcher', function () {
    describe('with the local setup', function () {
        useEnvironmentWithLocalSetup('hardhat-project');

        runTests();
    });

    function runTests() {
        let sender: zk.Wallet;
        let receiver: zk.Wallet;
        let provider: zk.Provider;
        let deployer: Deployer;
        let artifact: ZkSyncArtifact;
        let contract: zk.Contract;
        let gasPrice: number;
        let gasUsed: number;
        let txGasFees: number;
        let overrides: {};

        beforeEach(async function () {
            provider = zk.Provider.getDefaultProvider();
            sender = new zk.Wallet(RICH_WALLET_PK, provider);
            receiver = zk.Wallet.createRandom();

            deployer = new Deployer(this.hre, sender);
            artifact = await deployer.loadArtifact('ChangeEtherBalance');
            contract = await deployer.deploy(artifact);

            gasPrice = 100000000;
            gasUsed = 407817;
            txGasFees = gasPrice * gasUsed - 160200000000;;

            overrides = {
                type: 2,
                maxFeePerGas: 1 * gasPrice,
                maxPriorityFeePerGas: 1 * gasPrice,
            };
        });

        describe('Transaction Callback', () => {
            describe('Change balances, one account, one contract', () => {
                it('Should pass when all expected balance changes are equal to actual values', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: contract.address,
                            value: 200,
                        })
                    ).to.changeEtherBalances([sender, contract], [-200, 200]);
                });

                it('Should pass when all expected balance changes are equal to actual values - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: contract.address,
                            amount: 200,
                        })
                    ).to.changeEtherBalances([sender, contract], [-200, 200]);
                });
            });

            describe('Change balances, contract forwards ether sent', () => {
                it('Should pass when contract function forwards all tx ether', async () => {
                    await expect(() => contract.transferTo(receiver.address, { value: 200 })).to.changeEtherBalances(
                        [sender, contract, receiver],
                        [-200, 0, 200]
                    );
                });
            });

            describe('Change balance, multiple accounts', () => {
                it('Should pass when all expected balance changes are equal to actual values', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            gasPrice,
                        })
                    ).to.changeEtherBalances([sender, receiver], ['-200', 200]);
                });

                it('Should pass when all expected balance changes are equal to actual values - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        })
                    ).to.changeEtherBalances([sender, receiver], ['-200', 200]);
                });

                it('Should pass when given addresses as strings', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            gasPrice,
                        })
                    ).to.changeEtherBalances([sender.address, receiver.address], ['-200', 200]);
                });

                it('Should pass when given addresses as strings - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        })
                    ).to.changeEtherBalances([sender.address, receiver.address], ['-200', 200]);
                });

                it('Should pass when given native BigInt', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            gasPrice,
                        })
                    ).to.changeEtherBalances([sender, receiver], [BigInt('-200'), BigInt(200)]);
                });

                it('Should pass when given native BigInt - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        })
                    ).to.changeEtherBalances([sender, receiver], [BigInt('-200'), BigInt(200)]);
                });

                it('Should pass when given ethers BigNumber', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            gasPrice,
                        })
                    ).to.changeEtherBalances([sender, receiver], [BigNumber.from('-200'), BigNumber.from(200)]);
                });

                it('Should pass when given ethers BigNumber - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        })
                    ).to.changeEtherBalances([sender, receiver], [BigNumber.from('-200'), BigNumber.from(200)]);
                });

                it('Should take into account transaction fee (legacy tx)', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            gasPrice,
                        })
                    ).to.changeEtherBalances([sender, receiver, contract], [-(txGasFees + 200), 200, 0], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                    });
                });

                it('Should take into account transaction fee (legacy tx) - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        })
                    ).to.changeEtherBalances([sender, receiver, contract], [-(txGasFees + 200), 200, 0], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                    });
                });

                it('Should take into account transaction fee (1559 tx)', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            ...overrides,
                        })
                    ).to.changeEtherBalances([sender, receiver, contract], [-(txGasFees + 200), 200, 0], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                        overrides,
                    });
                });

                it('Should take into account transaction fee (1559 tx) - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides,
                        })
                    ).to.changeEtherBalances([sender, receiver, contract], [-(txGasFees + 200), 200, 0], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                        overrides,
                    });
                });

                it('Should pass when given a single address', async () => {
                    await expect(() =>
                        sender.sendTransaction({ to: receiver.address, value: 200 })
                    ).to.changeEtherBalances([sender], [-200]);
                });

                it('Should pass when given a single address - zkSync transfer', async () => {
                    await expect(() => sender.transfer({ to: receiver.address, amount: 200 })).to.changeEtherBalances(
                        [sender],
                        [-200]
                    );
                });

                it("Should pass when negated and numbers don't match", async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            gasPrice,
                        })
                    ).to.not.changeEtherBalances([sender, receiver], [-(txGasFees + 201), 200]);
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        })
                    ).to.not.changeEtherBalances([sender, receiver], [-200, 201], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                    });
                });

                it("Should pass when negated and numbers don't match - zkSync transfer", async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        })
                    ).to.not.changeEtherBalances([sender, receiver], [-(txGasFees + 201), 200]);
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        })
                    ).to.not.changeEtherBalances([sender, receiver], [-200, 201], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                    });
                });

                it('Should throw when expected balance change value was different from an actual for any wallet', async () => {
                    await expect(
                        expect(() =>
                            sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                                gasPrice,
                            })
                        ).to.changeEtherBalances([sender, receiver], [-200, 201])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${receiver.address} (the 2nd address in the list) to change by 201 wei, but it changed by 200 wei`
                    );
                    await expect(
                        expect(() =>
                            sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                                gasPrice,
                            })
                        ).to.changeEtherBalances([sender, receiver], [-201, 200])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${sender.address} (the 1st address in the list) to change by -201 wei, but it changed by -200 wei`
                    );
                });

                it('Should throw when expected balance change value was different from an actual for any wallet - zkSync transfer', async () => {
                    await expect(
                        expect(() =>
                            sender.transfer({
                                to: receiver.address,
                                amount: 200,
                                overrides: {
                                    gasPrice,
                                },
                            })
                        ).to.changeEtherBalances([sender, receiver], [-200, 201])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${receiver.address} (the 2nd address in the list) to change by 201 wei, but it changed by 200 wei`
                    );
                    await expect(
                        expect(() =>
                            sender.transfer({
                                to: receiver.address,
                                amount: 200,
                                overrides: {
                                    gasPrice,
                                },
                            })
                        ).to.changeEtherBalances([sender, receiver], [-201, 200])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${sender.address} (the 1st address in the list) to change by -201 wei, but it changed by -200 wei`
                    );
                });

                it('Should throw in negative case when expected balance changes value were equal to an actual', async () => {
                    await expect(
                        expect(() =>
                            sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                                gasPrice,
                            })
                        ).to.not.changeEtherBalances([sender, receiver], [-200, 200])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${sender.address} (the 1st address in the list) NOT to change by -200 wei`
                    );
                });

                it('Should throw in negative case when expected balance changes value were equal to an actual - zkSync transfer', async () => {
                    await expect(
                        expect(() =>
                            sender.transfer({
                                to: receiver.address,
                                amount: 200,
                                overrides: {
                                    gasPrice,
                                },
                            })
                        ).to.not.changeEtherBalances([sender, receiver], [-200, 200])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${sender.address} (the 1st address in the list) NOT to change by -200 wei`
                    );
                });
            });

            it("shouldn't run the transaction twice", async function () {
                const receiverBalanceBefore = await provider.getBalance(receiver.address);

                await expect(() =>
                    sender.sendTransaction({
                        to: receiver.address,
                        value: 200,
                        gasPrice,
                    })
                ).to.changeEtherBalances([sender, receiver], [-200, 200]);

                const receiverBalanceChange = (await provider.getBalance(receiver.address)).sub(receiverBalanceBefore);

                expect(receiverBalanceChange.toNumber()).to.equal(200);
            });

            it("shouldn't run the transaction twice - zkSync transfer", async function () {
                const receiverBalanceBefore = await provider.getBalance(receiver.address);

                await expect(() =>
                    sender.transfer({
                        to: receiver.address,
                        amount: 200,
                        overrides: {
                            gasPrice,
                        },
                    })
                ).to.changeEtherBalances([sender, receiver], [-200, 200]);

                const receiverBalanceChange = (await provider.getBalance(receiver.address)).sub(receiverBalanceBefore);

                expect(receiverBalanceChange.toNumber()).to.equal(200);
            });
        });

        describe('Transaction Response', () => {
            describe('Change balances, one account, one contract', () => {
                it('Should pass when all expected balance changes are equal to actual values', async () => {
                    await expect(
                        await sender.sendTransaction({
                            to: contract.address,
                            value: 200,
                        })
                    ).to.changeEtherBalances([sender, contract], [-200, 200]);
                });

                it('Should pass when all expected balance changes are equal to actual values - zkSync contract', async () => {
                    await expect(
                        await sender.transfer({
                            to: contract.address,
                            amount: 200,
                        })
                    ).to.changeEtherBalances([sender, contract], [-200, 200]);
                });
            });

            describe('Change balance, multiple accounts', () => {
                it('Should pass when all expected balance changes are equal to actual values', async () => {
                    await expect(
                        await sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            gasPrice,
                        })
                    ).to.changeEtherBalances([sender, receiver], [(-(txGasFees + 200)).toString(), 200], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                    });
                });

                it('Should pass when all expected balance changes are equal to actual values - zkSync transfer', async () => {
                    await expect(
                        await sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        })
                    ).to.changeEtherBalances([sender, receiver], [(-(txGasFees + 200)).toString(), 200], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                    });
                });

                it('Should take into account transaction fee', async () => {
                    await expect(
                        await sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            gasPrice,
                        })
                    ).to.changeEtherBalances([sender, receiver, contract], [-(txGasFees + 200), 200, 0], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                    });
                });

                it('Should take into account transaction fee - zkSync transfer', async () => {
                    await expect(
                        await sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        })
                    ).to.changeEtherBalances([sender, receiver, contract], [-(txGasFees + 200), 200, 0], {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                    });
                });

                it("Should pass when negated and numbers don't match", async () => {
                    await expect(
                        await sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        })
                    ).to.not.changeEtherBalances([sender, receiver], [-201, 200]);

                    await expect(
                        await sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        })
                    ).to.not.changeEtherBalances([sender, receiver], [-200, 201]);
                });

                it("Should pass when negated and numbers don't match - zkSync transfer", async () => {
                    await expect(
                        await sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        })
                    ).to.not.changeEtherBalances([sender, receiver], [-201, 200]);

                    await expect(
                        await sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        })
                    ).to.not.changeEtherBalances([sender, receiver], [-200, 201]);
                });

                it('Should throw when fee was not calculated correctly', async () => {
                    await expect(
                        expect(
                            await sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                                gasPrice,
                            })
                        ).to.changeEtherBalances([sender, receiver], [-200, 200], {
                            balanceChangeOptions: {
                                includeFee: true,
                            },
                        })
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${
                            sender.address
                        } (the 1st address in the list) to change by -200 wei, but it changed by -${
                            txGasFees + 200
                        } wei`
                    );
                });

                it('Should throw when fee was not calculated correctly - zkSync transfer', async () => {
                    await expect(
                        expect(
                            await sender.transfer({
                                to: receiver.address,
                                amount: 200,
                                overrides: {
                                    gasPrice,
                                },
                            })
                        ).to.changeEtherBalances([sender, receiver], [-200, 200], {
                            balanceChangeOptions: {
                                includeFee: true,
                            },
                        })
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${
                            sender.address
                        } (the 1st address in the list) to change by -200 wei, but it changed by -${
                            txGasFees + 200
                        } wei`
                    );
                });

                it('Should throw when expected balance change value was different from an actual for any wallet', async () => {
                    await expect(
                        expect(
                            await sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                            })
                        ).to.changeEtherBalances([sender, receiver], [-200, 201])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${receiver.address} (the 2nd address in the list) to change by 201 wei, but it changed by 200 wei`
                    );

                    await expect(
                        expect(
                            await sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                            })
                        ).to.changeEtherBalances([sender, receiver], [-201, 200])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${sender.address} (the 1st address in the list) to change by -201 wei, but it changed by -200 wei`
                    );
                });

                it('Should throw when expected balance change value was different from an actual for any wallet - zkSync transfer', async () => {
                    await expect(
                        expect(
                            await sender.transfer({
                                to: receiver.address,
                                amount: 200,
                            })
                        ).to.changeEtherBalances([sender, receiver], [-200, 201])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${receiver.address} (the 2nd address in the list) to change by 201 wei, but it changed by 200 wei`
                    );

                    await expect(
                        expect(
                            await sender.transfer({
                                to: receiver.address,
                                amount: 200,
                            })
                        ).to.changeEtherBalances([sender, receiver], [-201, 200])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${sender.address} (the 1st address in the list) to change by -201 wei, but it changed by -200 wei`
                    );
                });

                it('Should throw in negative case when expected balance changes value were equal to an actual', async () => {
                    await expect(
                        expect(
                            await sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                            })
                        ).to.not.changeEtherBalances([sender, receiver], [-200, 200])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${sender.address} (the 1st address in the list) NOT to change by -200`
                    );
                });

                it('Should throw in negative case when expected balance changes value were equal to an actual - zkSync transfer', async () => {
                    await expect(
                        expect(
                            await sender.transfer({
                                to: receiver.address,
                                amount: 200,
                            })
                        ).to.not.changeEtherBalances([sender, receiver], [-200, 200])
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of ${sender.address} (the 1st address in the list) NOT to change by -200`
                    );
                });
            });
        });

        describe('stack traces', function () {
            it('includes test file', async function () {
                try {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        })
                    ).to.changeEtherBalances([sender, receiver], [-100, 100]);
                } catch (e: any) {
                    expect(util.inspect(e)).to.include(path.join('test', 'changeEtherBalances.ts'));

                    return;
                }

                expect.fail('Expected an exception but none was thrown');
            });

            it('includes test file - zkSync transfer', async function () {
                try {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        })
                    ).to.changeEtherBalances([sender, receiver], [-100, 100]);
                } catch (e: any) {
                    expect(util.inspect(e)).to.include(path.join('test', 'changeEtherBalances.ts'));

                    return;
                }

                expect.fail('Expected an exception but none was thrown');
            });
        });
    }
});
