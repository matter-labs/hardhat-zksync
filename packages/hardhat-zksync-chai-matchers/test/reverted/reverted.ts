import { AssertionError, expect } from 'chai';
import path from 'path';
import util from 'util';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { runSuccessfulAsserts, runFailedAsserts, useEnvironmentWithLocalSetup } from '../helpers';
import '../../src/internal/add-chai-matchers';
import { HttpNetworkConfig } from 'hardhat/types';

const RICH_WALLET_1_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
const RICH_WALLET_2_PK = '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';

describe('INTEGRATION: Reverted', function () {
    describe('with the local setup', function () {
        useEnvironmentWithLocalSetup('hardhat-project');

        runTests();
    });

    function runTests() {
        let matchers: zk.Contract;
        let aaAccount: zk.Contract;
        let provider: zk.Provider;
        let wallet1: zk.Wallet;
        let wallet2: zk.Wallet;
        let deployer: Deployer;
        let artifact: ZkSyncArtifact;
        let aaDeployer: Deployer;

        beforeEach('deploy matchers contract', async function () {
            const hre = await import("hardhat");
            provider = new zk.Provider((hre.network.config as HttpNetworkConfig).url);
            wallet1 = new zk.Wallet(RICH_WALLET_1_PK, provider);
            wallet2 = new zk.Wallet(RICH_WALLET_2_PK, provider);

            deployer = new Deployer(this.hre, wallet1);
            artifact = await deployer.loadArtifact('Matchers');
            matchers = await deployer.deploy(artifact);

            aaDeployer = new Deployer(this.hre, wallet1, 'createAccount');
            artifact = await deployer.loadArtifact("TwoUserMultisig");
            aaAccount = await aaDeployer.deploy(artifact, [wallet1.address, wallet2.address], undefined, []);
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

        describe('calling abstraction account', function () {
            it('successfuly reverts', async function () {

                await (await wallet1.sendTransaction({to: await aaAccount.getAddress(), value: ethers.parseEther("0.8")})).wait();
                
                let aaTx = await matchers.succeeds();

                const gasLimit = await provider.estimateGas(aaTx);
                const gasPrice = await provider.getGasPrice();
            
                aaTx = {
                    ...aaTx,
                    from: await aaAccount.getAddress(),
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    chainId: (await provider.getNetwork()).chainId,
                    nonce: await provider.getTransactionCount(await aaAccount.getAddress()),
                    type: 113,
                    customData: {
                      gasPerPubdata: zk.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    } as zk.types.Eip712Meta,
                    value: 0n,
                };

                const singedTx = await wallet1.eip712.sign(aaTx);

                aaTx.customData = {
                    ...aaTx.customData,
                    customSignature: singedTx,
                };

                await expect(provider.broadcastTransaction(zk.utils.serializeEip712(aaTx))).to.be.reverted;
            });
        });
    }
});
