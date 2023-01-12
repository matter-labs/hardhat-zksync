import { AssertionError, expect } from 'chai';
import * as zk from 'zksync-web3';
import path from 'path';
import util from 'util';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { runSuccessfulAsserts, runFailedAsserts, useEnvironmentWithLocalSetup } from '../helpers';
import '../../src/internal/add-chai-matchers';

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('INTEGRATION: Reverted with', function () {
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

        describe('calling a method that succeeds', function () {
            it('successful asserts', async function () {
                await runSuccessfulAsserts({
                    matchers,
                    method: 'succeeds',
                    successfulAssert: (x) => expect(x).not.to.be.revertedWith('some reason'),
                });
            });

            it('failed asserts', async function () {
                await runFailedAsserts({
                    matchers,
                    method: 'succeeds',
                    failedAssert: (x) => expect(x).to.be.revertedWith('some reason'),
                    failedAssertReason:
                        "Expected transaction to be reverted with reason 'some reason', but it didn't revert",
                });
            });
        });

        describe('calling a method that reverts without a reason', function () {
            it('successful asserts', async function () {
                await runSuccessfulAsserts({
                    matchers,
                    method: 'revertsWithoutReason',
                    args: [],
                    successfulAssert: (x) => expect(x).to.not.be.revertedWith('some reason'),
                });
            });
        });

        describe('calling a method that reverts with a reason string', function () {
            it('successful asserts', async function () {
                await runSuccessfulAsserts({
                    matchers,
                    method: 'revertsWith',
                    args: ['some reason'],
                    successfulAssert: (x) => expect(x).to.be.revertedWith('some reason'),
                });

                await runSuccessfulAsserts({
                    matchers,
                    method: 'revertsWith',
                    args: ['some reason'],
                    successfulAssert: (x) => expect(x).to.not.be.revertedWith('another reason'),
                });
            });

            it('failed asserts: expected reason not to match', async function () {
                await runFailedAsserts({
                    matchers,
                    method: 'revertsWith',
                    args: ['some reason'],
                    failedAssert: (x) => expect(x).to.not.be.revertedWith('some reason'),
                    failedAssertReason: "Expected transaction NOT to be reverted with reason 'some reason', but it was",
                });
            });

            it('failed asserts: expected a different reason', async function () {
                await runFailedAsserts({
                    matchers,
                    method: 'revertsWith',
                    args: ['another reason'],
                    failedAssert: (x) => expect(x).to.be.revertedWith('some reason'),
                    failedAssertReason:
                        "Expected transaction to be reverted with reason 'some reason', but it reverted with reason 'another reason'",
                });
            });
        });

        describe('calling a method that reverts with a panic code', function () {
            it('successful asserts', async function () {
                await runSuccessfulAsserts({
                    matchers,
                    method: 'panicAssert',
                    successfulAssert: (x) => expect(x).to.not.be.revertedWith('some reason'),
                });
            });

            it('failed asserts', async function () {
                await runFailedAsserts({
                    matchers,
                    method: 'panicAssert',
                    failedAssert: (x) => expect(x).to.be.revertedWith('some reason'),
                    failedAssertReason:
                        "Expected transaction to be reverted with reason 'some reason', but it reverted with panic code 0x01 (Assertion error)",
                });
            });
        });

        describe('calling a method that reverts with a custom error', function () {
            it('successful asserts', async function () {
                await runSuccessfulAsserts({
                    matchers,
                    method: 'revertWithSomeCustomError',
                    successfulAssert: (x) => expect(x).to.not.be.revertedWith('some reason'),
                });
            });

            it('failed asserts', async function () {
                await runFailedAsserts({
                    matchers,
                    method: 'revertWithSomeCustomError',
                    failedAssert: (x) => expect(x).to.be.revertedWith('some reason'),
                    failedAssertReason:
                        "Expected transaction to be reverted with reason 'some reason', but it reverted with a custom error",
                });
            });
        });

        describe('invalid values', function () {
            it('non-errors as subject', async function () {
                await expect(expect(Promise.reject({})).to.be.revertedWith('some reason')).to.be.rejectedWith(
                    AssertionError,
                    'Expected an Error object'
                );
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
                    await expect(matchers.revertsWith('bar')).to.be.revertedWith('foo');
                } catch (e: any) {
                    expect(util.inspect(e)).to.include(path.join('test', 'reverted', 'revertedWith.ts'));

                    return;
                }

                expect.fail('Expected an exception but none was thrown');
            });
        });
    }
});
