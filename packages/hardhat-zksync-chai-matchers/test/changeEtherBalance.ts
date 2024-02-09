import { expect, AssertionError } from 'chai';
import { BigNumber } from 'ethers';
import * as zk from 'zksync-ethers';
import path from 'path';
import util from 'util';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { useEnvironmentWithLocalSetup } from './helpers';
import '../src/internal/add-chai-matchers';

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('INTEGRATION: changeEtherBalance matcher', function () {
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
        let _txGasFees: number;
        let _overrides: {};

        beforeEach(async function () {
            provider = zk.Provider.getDefaultProvider();
            sender = new zk.Wallet(RICH_WALLET_PK, provider);
            receiver = zk.Wallet.createRandom();

            deployer = new Deployer(this.hre, sender);
            artifact = await deployer.loadArtifact('ChangeEtherBalance');
            contract = await deployer.deploy(artifact);

            gasPrice = 250000000;
            gasUsed = 157263;
            _txGasFees = gasPrice * gasUsed;

            _overrides = {
                type: 2,
                maxFeePerGas: 1 * gasPrice,
                maxPriorityFeePerGas: 1 * gasPrice,
            };
        });

        describe('Transaction Callback (legacy tx)', () => {
            describe('Change balance, one account', () => {
                it('Should pass when expected balance change is passed as string and is equal to an actual', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(sender, '-200');
                });

                it('Should pass when given an address as a string', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(sender.address, '-200');
                });

                it('Should pass when given an address as a string - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(sender.address, '-200');
                });

                it('Should pass when given a native bigint', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(sender, BigInt('-200'));
                });

                it('Should pass when given a native bigint - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(sender, BigInt('-200'));
                });

                it('Should pass when given an ethers BigNumber', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(sender, BigNumber.from('-200'));
                });

                it('Should pass when given an ethers BigNumber - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(sender, BigNumber.from('-200'));
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(receiver, 200);
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(receiver, 200);
                });

                it("Should ignore fee if receiver's wallet is being checked and includeFee was set - zkSync transfer", async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        }),
                    ).to.changeEtherBalance(receiver, 200, {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                    });
                });

                it('Should take into account transaction fee by default', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            gasPrice,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(sender, -200);
                });

                it('Should take into account transaction fee by default - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: {
                                gasPrice,
                            },
                        }),
                    ).to.changeEtherBalance(sender, -200);
                });

                it('Should pass when expected balance change is passed as BN and is equal to an actual', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(receiver, BigNumber.from(200));
                });

                it('Should pass when expected balance change is passed as BN and is equal to an actual - zkSync tranfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(receiver, BigNumber.from(200));
                });

                it('Should pass on negative case when expected balance change is not equal to an actual', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.not.changeEtherBalance(receiver, BigNumber.from(300));
                });

                it('Should pass on negative case when expected balance change is not equal to an actual - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.not.changeEtherBalance(receiver, BigNumber.from(300));
                });

                it('Should throw when expected balance change value was different from an actual', async () => {
                    await expect(
                        expect(() =>
                            sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                            }),
                        ).to.changeEtherBalance(sender, '-500'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" to change by -500 wei, but it changed by -200 wei`,
                    );
                });

                it('Should throw when expected balance change value was different from an actual - zkSync transfer', async () => {
                    await expect(
                        expect(() =>
                            sender.transfer({
                                to: receiver.address,
                                amount: 200,
                            }),
                        ).to.changeEtherBalance(sender, '-500'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" to change by -500 wei, but it changed by -200 wei`,
                    );
                });

                it('Should throw in negative case when expected balance change value was equal to an actual', async () => {
                    await expect(
                        expect(() =>
                            sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                            }),
                        ).to.not.changeEtherBalance(sender, '-200'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" NOT to change by -200 wei, but it did`,
                    );
                });

                it('Should throw in negative case when expected balance change value was equal to an actual - zkSync transfer', async () => {
                    await expect(
                        expect(() =>
                            sender.transfer({
                                to: receiver.address,
                                amount: 200,
                            }),
                        ).to.not.changeEtherBalance(sender, '-200'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" NOT to change by -200 wei, but it did`,
                    );
                });

                it('Should pass when given zero value tx', async () => {
                    await expect(() =>
                        sender.sendTransaction({ to: receiver.address, value: 0 }),
                    ).to.changeEtherBalance(sender, 0);
                });

                it('Should pass when given zero value tx - zkSync transfer', async () => {
                    await expect(() => sender.transfer({ to: receiver.address, amount: 0 })).to.changeEtherBalance(
                        sender,
                        0,
                    );
                });

                it("shouldn't run the transaction twice", async function () {
                    const receiverBalanceBefore = await provider.getBalance(receiver.address);

                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(sender, -200);

                    const receiverBalanceChange = (await provider.getBalance(receiver.address)).sub(
                        receiverBalanceBefore,
                    );

                    expect(receiverBalanceChange.toNumber()).to.equal(200);
                });

                it("shouldn't run the transaction twice - zkSync transfer", async function () {
                    const receiverBalanceBefore = await provider.getBalance(receiver.address);

                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(sender, -200);

                    const receiverBalanceChange = (await provider.getBalance(receiver.address)).sub(
                        receiverBalanceBefore,
                    );

                    expect(receiverBalanceChange.toNumber()).to.equal(200);
                });
            });

            describe('Change balance, one contract', () => {
                it('Should pass when expected balance change is passed as int and is equal to an actual', async () => {
                    await expect(async () =>
                        sender.sendTransaction({
                            to: contract.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(contract, 200);
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual - zkSync transfer', async () => {
                    await expect(async () =>
                        sender.transfer({
                            to: contract.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(contract, 200);
                });

                // it('Should pass when calling function that returns half the sent ether', async () => {
                //     await expect(async () => contract.returnHalf({ value: 200 })).to.changeEtherBalance(sender, -100);
                // });
            });
        });

        describe('Transaction Callback (1559 tx)', () => {
            describe('Change balance, one account', () => {
                it('Should pass when expected balance change is passed as string and is equal to an actual - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: _overrides,
                        }),
                    ).to.changeEtherBalance(sender, '-200', { overrides: _overrides });
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            ..._overrides,
                        }),
                    ).to.changeEtherBalance(receiver, 200, { overrides: _overrides });
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: _overrides,
                        }),
                    ).to.changeEtherBalance(receiver, 200, { overrides: _overrides });
                });

                it("Should ignore fee if receiver's wallet is being checked and includeFee was set", async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            ..._overrides,
                        }),
                    ).to.changeEtherBalance(receiver, 200, {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                        overrides: _overrides,
                    });
                });

                it("Should ignore fee if receiver's wallet is being checked and includeFee was set - zkSync transfer", async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: _overrides,
                        }),
                    ).to.changeEtherBalance(receiver, 200, {
                        balanceChangeOptions: {
                            includeFee: true,
                        },
                        overrides: _overrides,
                    });
                });

                it('Should take into account transaction fee by default', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            ..._overrides,
                        }),
                    ).to.changeEtherBalance(sender, -200, { overrides: _overrides });
                });

                it('Should take into account transaction fee by default - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: _overrides,
                        }),
                    ).to.changeEtherBalance(sender, -200, { overrides: _overrides });
                });

                it('Should pass when expected balance change is passed as BN and is equal to an actual', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(receiver, BigNumber.from(200), { overrides: _overrides });
                });

                it('Should pass when expected balance change is passed as BN and is equal to an actual - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(receiver, BigNumber.from(200), { overrides: _overrides });
                });

                it('Should pass on negative case when expected balance change is not equal to an actual', async () => {
                    await expect(() =>
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                            ..._overrides,
                        }),
                    ).to.not.changeEtherBalance(receiver, BigNumber.from(300), { overrides: _overrides });
                });

                it('Should pass on negative case when expected balance change is not equal to an actual - zkSync transfer', async () => {
                    await expect(() =>
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                            overrides: _overrides,
                        }),
                    ).to.not.changeEtherBalance(receiver, BigNumber.from(300), { overrides: _overrides });
                });

                it('Should throw when expected balance change value was different from an actual', async () => {
                    await expect(
                        expect(() =>
                            sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                                ..._overrides,
                            }),
                        ).to.changeEtherBalance(sender, '-500', { overrides: _overrides }),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" to change by -500 wei, but it changed by -200 wei`,
                    );
                });

                it('Should throw when expected balance change value was different from an actual - zkSync transfer', async () => {
                    await expect(
                        expect(() =>
                            sender.transfer({
                                to: receiver.address,
                                amount: 200,
                                overrides: _overrides,
                            }),
                        ).to.changeEtherBalance(sender, '-500', { overrides: _overrides }),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" to change by -500 wei, but it changed by -200 wei`,
                    );
                });

                it('Should throw in negative case when expected balance change value was equal to an actual', async () => {
                    await expect(
                        expect(() =>
                            sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                                ..._overrides,
                            }),
                        ).to.not.changeEtherBalance(sender, '-200', { overrides: _overrides }),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" NOT to change by -200 wei, but it did`,
                    );
                });

                it('Should throw in negative case when expected balance change value was equal to an actual - zkSync transfer', async () => {
                    await expect(
                        expect(() =>
                            sender.transfer({
                                to: receiver.address,
                                amount: 200,
                                overrides: _overrides,
                            }),
                        ).to.not.changeEtherBalance(sender, '-200', { overrides: _overrides }),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" NOT to change by -200 wei, but it did`,
                    );
                });
            });

            describe('Change balance, one contract', () => {
                it('Should pass when expected balance change is passed as int and is equal to an actual', async () => {
                    await expect(async () =>
                        sender.sendTransaction({
                            to: contract.address,
                            value: 200,
                            ..._overrides,
                        }),
                    ).to.changeEtherBalance(contract, 200, { overrides: _overrides });
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual - zkSync transfer', async () => {
                    await expect(async () =>
                        sender.transfer({
                            to: contract.address,
                            amount: 200,
                            overrides: _overrides,
                        }),
                    ).to.changeEtherBalance(contract, 200, { overrides: _overrides });
                });

                // it('should pass when calling function that returns half the sent ether', async () => {
                //     await expect(async () =>
                //         contract.returnHalf({
                //             value: 200,
                //             ...overrides,
                //         })
                //     ).to.changeEtherBalance(sender, -100, { overrides });
                // });
            });

            it("shouldn't run the transaction twice", async function () {
                const receiverBalanceBefore = await provider.getBalance(receiver.address);

                await expect(() =>
                    sender.sendTransaction({
                        to: receiver.address,
                        value: 200,
                        ..._overrides,
                    }),
                ).to.changeEtherBalance(sender, -200, { overrides: _overrides });

                const receiverBalanceChange = (await provider.getBalance(receiver.address)).sub(receiverBalanceBefore);

                expect(receiverBalanceChange.toNumber()).to.equal(200);
            });

            it("shouldn't run the transaction twice - zkSync transfer", async function () {
                const receiverBalanceBefore = await provider.getBalance(receiver.address);

                await expect(() =>
                    sender.transfer({
                        to: receiver.address,
                        amount: 200,
                        overrides: _overrides,
                    }),
                ).to.changeEtherBalance(sender, -200, { overrides: _overrides });

                const receiverBalanceChange = (await provider.getBalance(receiver.address)).sub(receiverBalanceBefore);

                expect(receiverBalanceChange.toNumber()).to.equal(200);
            });
        });

        describe('Transaction Response', () => {
            describe('Change balance, one account', () => {
                it('Should pass when expected balance change is passed as string and is equal to an actual', async () => {
                    await expect(
                        await sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(sender, '-200');
                });

                it('Should pass when expected balance change is passed as string and is equal to an actual - zkSync transfer', async () => {
                    await expect(
                        await sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(sender, '-200');
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual', async () => {
                    await expect(
                        await sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(receiver, 200);
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual - zkSync transfer', async () => {
                    await expect(
                        await sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(receiver, 200);
                });

                it('Should pass when expected balance change is passed as BN and is equal to an actual', async () => {
                    await expect(
                        await sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(sender, BigNumber.from(-200));
                });

                it('Should pass when expected balance change is passed as BN and is equal to an actual - zkSync transfer', async () => {
                    await expect(
                        await sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(sender, BigNumber.from(-200));
                });

                it('Should pass on negative case when expected balance change is not equal to an actual', async () => {
                    await expect(
                        await sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.not.changeEtherBalance(receiver, BigNumber.from(300));
                });

                it('Should pass on negative case when expected balance change is not equal to an actual - zkSync transfer', async () => {
                    await expect(
                        await sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.not.changeEtherBalance(receiver, BigNumber.from(300));
                });

                it('Should throw when expected balance change value was different from an actual', async () => {
                    await expect(
                        expect(
                            await sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                            }),
                        ).to.changeEtherBalance(sender, '-500'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" to change by -500 wei, but it changed by -200 wei`,
                    );
                });

                it('Should throw when expected balance change value was different from an actual - zkSync transfer', async () => {
                    await expect(
                        expect(
                            await sender.transfer({
                                to: receiver.address,
                                amount: 200,
                            }),
                        ).to.changeEtherBalance(sender, '-500'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" to change by -500 wei, but it changed by -200 wei`,
                    );
                });

                it('Should throw in negative case when expected balance change value was equal to an actual', async () => {
                    await expect(
                        expect(
                            await sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                            }),
                        ).to.not.changeEtherBalance(sender, '-200'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" NOT to change by -200 wei, but it did`,
                    );
                });

                it('Should throw in negative case when expected balance change value was equal to an actual - zkSync transfer', async () => {
                    await expect(
                        expect(
                            await sender.transfer({
                                to: receiver.address,
                                amount: 200,
                            }),
                        ).to.not.changeEtherBalance(sender, '-200'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" NOT to change by -200 wei, but it did`,
                    );
                });
            });

            describe('Change balance, one contract', () => {
                it('Should pass when expected balance change is passed as int and is equal to an actual', async () => {
                    await expect(
                        await sender.sendTransaction({
                            to: contract.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(contract, 200);
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual - zkSync transfer', async () => {
                    await expect(
                        await sender.transfer({
                            to: contract.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(contract, 200);
                });
            });
        });

        describe('Transaction Promise', () => {
            describe('Change balance, one account', () => {
                it('Should pass when expected balance change is passed as string and is equal to an actual', async () => {
                    await expect(
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(sender, '-200');
                });

                it('Should pass when expected balance change is passed as string and is equal to an actual - zkSync transfer', async () => {
                    await expect(
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(sender, '-200');
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual', async () => {
                    await expect(
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(receiver, 200);
                });

                it('Should pass when expected balance change is passed as int and is equal to an actual - zkSync transfer', async () => {
                    await expect(
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(receiver, 200);
                });

                it('Should pass when expected balance change is passed as BN and is equal to an actual', async () => {
                    await expect(
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.changeEtherBalance(sender, BigNumber.from(-200));
                });

                it('Should pass when expected balance change is passed as BN and is equal to an actual - zkSync transfer', async () => {
                    await expect(
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.changeEtherBalance(sender, BigNumber.from(-200));
                });

                it('Should pass on negative case when expected balance change is not equal to an actual', async () => {
                    await expect(
                        sender.sendTransaction({
                            to: receiver.address,
                            value: 200,
                        }),
                    ).to.not.changeEtherBalance(receiver, BigNumber.from(300));
                });

                it('Should pass on negative case when expected balance change is not equal to an actual - zkSync transfer', async () => {
                    await expect(
                        sender.transfer({
                            to: receiver.address,
                            amount: 200,
                        }),
                    ).to.not.changeEtherBalance(receiver, BigNumber.from(300));
                });

                it('Should throw when expected balance change value was different from an actual', async () => {
                    await expect(
                        expect(
                            sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                            }),
                        ).to.changeEtherBalance(sender, '-500'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" to change by -500 wei, but it changed by -200 wei`,
                    );
                });

                it('Should throw when expected balance change value was different from an actual - zkSync transfer', async () => {
                    await expect(
                        expect(
                            sender.transfer({
                                to: receiver.address,
                                amount: 200,
                            }),
                        ).to.changeEtherBalance(sender, '-500'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" to change by -500 wei, but it changed by -200 wei`,
                    );
                });

                it('Should throw in negative case when expected balance change value was equal to an actual', async () => {
                    await expect(
                        expect(
                            sender.sendTransaction({
                                to: receiver.address,
                                value: 200,
                            }),
                        ).to.not.changeEtherBalance(sender, '-200'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" NOT to change by -200 wei, but it did`,
                    );
                });

                it('Should throw in negative case when expected balance change value was equal to an actual - zkSync transfer', async () => {
                    await expect(
                        expect(
                            sender.transfer({
                                to: receiver.address,
                                amount: 200,
                            }),
                        ).to.not.changeEtherBalance(sender, '-200'),
                    ).to.be.eventually.rejectedWith(
                        AssertionError,
                        `Expected the ether balance of "${sender.address}" NOT to change by -200 wei, but it did`,
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
                        }),
                    ).to.changeEtherBalance(sender, -100);
                } catch (e: any) {
                    expect(util.inspect(e)).to.include(path.join('test', 'changeEtherBalance.ts'));

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
                        }),
                    ).to.changeEtherBalance(sender, -100);
                } catch (e: any) {
                    expect(util.inspect(e)).to.include(path.join('test', 'changeEtherBalance.ts'));

                    return;
                }

                expect.fail('Expected an exception but none was thrown');
            });
        });
    }
});
