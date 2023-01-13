import { AssertionError, expect } from 'chai';
import path from 'path';
import util from 'util';
import * as zk from 'zksync-web3';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { runSuccessfulAsserts, runFailedAsserts, useEnvironmentWithLocalSetup } from '../helpers';
import '../../src/internal/add-chai-matchers';

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('INTEGRATION: Reverted', function () {
    describe('with the local setup', function () {
        useEnvironmentWithLocalSetup('hardhat-project');

        runTests();
    });

    function runTests() {
        let matchers: zk.Contract;
        let provider: zk.Provider;
        let wallet: zk.Wallet;
        let deployer: Deployer;
        let artifact: ZkSyncArtifact;

        beforeEach('deploy matchers contract', async function () {
            provider = zk.Provider.getDefaultProvider();
            wallet = new zk.Wallet(RICH_WALLET_PK, provider);

            deployer = new Deployer(this.hre, wallet);
            artifact = await deployer.loadArtifact('Matchers');
            matchers = await deployer.deploy(artifact);
        });

        // helpers
        const expectAssertionError = async (x: Promise<void>, message: string) => {
            return expect(x).to.be.eventually.rejectedWith(AssertionError, message);
        };

        describe('with a string as its subject', function () {
            it('invalid string', async function () {
                await expect(expect('0x123').to.be.reverted).to.be.rejectedWith(
                    TypeError,
                    "Expected a valid transaction hash, but got '0x123'"
                );

                await expect(expect('0x123').to.not.be.reverted).to.be.rejectedWith(
                    TypeError,
                    "Expected a valid transaction hash, but got '0x123'"
                );
            });

            it('promise of an invalid string', async function () {
                await expect(expect(Promise.resolve('0x123')).to.be.reverted).to.be.rejectedWith(
                    TypeError,
                    "Expected a valid transaction hash, but got '0x123'"
                );

                await expect(expect(Promise.resolve('0x123')).to.not.be.reverted).to.be.rejectedWith(
                    TypeError,
                    "Expected a valid transaction hash, but got '0x123'"
                );
            });
        });

        describe('calling a contract method that succeeds', function () {
            it('successful asserts', async function () {
                await runSuccessfulAsserts({
                    matchers,
                    method: 'succeeds',
                    args: [],
                    successfulAssert: (x) => expect(x).to.not.be.reverted,
                });
            });

            it('failed asserts', async function () {
                await runFailedAsserts({
                    matchers,
                    method: 'succeeds',
                    args: [],
                    failedAssert: (x) => expect(x).to.be.reverted,
                    failedAssertReason: 'Expected transaction to be reverted',
                });
            });
        });

        describe('calling a method that reverts with a reason string', function () {
            it('successful asserts', async function () {
                await runSuccessfulAsserts({
                    matchers,
                    method: 'revertsWith',
                    args: ['some reason'],
                    successfulAssert: (x) => expect(x).to.be.reverted,
                });
            });

            it('failed asserts', async function () {
                await runFailedAsserts({
                    matchers,
                    method: 'revertsWith',
                    args: ['some reason'],
                    failedAssert: (x) => expect(x).not.to.be.reverted,
                    failedAssertReason: 'Expected transaction NOT to be reverted',
                });
            });
        });

        describe('calling a method that reverts with a panic code', function () {
            it('successful asserts', async function () {
                await runSuccessfulAsserts({
                    matchers,
                    method: 'panicAssert',
                    args: [],
                    successfulAssert: (x) => expect(x).to.be.reverted,
                });
            });

            it('failed asserts', async function () {
                await runFailedAsserts({
                    matchers,
                    method: 'panicAssert',
                    args: [],
                    failedAssert: (x) => expect(x).not.to.be.reverted,
                    failedAssertReason: 'Expected transaction NOT to be reverted',
                });
            });
        });

        describe('calling a method that reverts with a custom error', function () {
            it('successful asserts', async function () {
                await runSuccessfulAsserts({
                    matchers,
                    method: 'revertWithSomeCustomError',
                    args: [],
                    successfulAssert: (x) => expect(x).to.be.reverted,
                });
            });

            it('failed asserts', async function () {
                await runFailedAsserts({
                    matchers,
                    method: 'revertWithSomeCustomError',
                    args: [],
                    failedAssert: (x) => expect(x).not.to.be.reverted,
                    failedAssertReason: 'Expected transaction NOT to be reverted',
                });
            });
        });

        describe('invalid rejection values', function () {
            it('non-errors', async function () {
                await expectAssertionError(expect(Promise.reject({})).to.be.reverted, 'Expected an Error object');
            });

            it('errors that are not related to a reverted transaction', async function () {
                const signer = zk.Wallet.createRandom().connect(provider);

                await expect(
                    expect(
                        matchers.connect(signer).revertsWithoutReason({
                            gasLimit: 1_000_000,
                        })
                    ).to.not.be.revertedWithCustomError(matchers, 'SomeCustomError')
                ).to.be.eventually.rejectedWith(
                    Error,
                    'Not enough balance to cover the fee + value.'
                );
            });
        });

        describe('stack traces', function () {
            it('includes test file', async function () {
                try {
                    await expect(matchers.succeeds()).to.be.reverted;
                } catch (e: any) {
                    expect(util.inspect(e)).to.include(path.join('test', 'reverted', 'reverted.ts'));

                    return;
                }

                expect.fail('Expected an exception but none was thrown');
            });
        });
    }
});
