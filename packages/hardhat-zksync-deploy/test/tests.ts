import { assert, expect } from 'chai';
import * as path from 'path';
import chalk from 'chalk';
import { ethers } from 'ethers';
import { Provider, Wallet } from 'zksync-ethers';
import { callDeployScripts, findDeployScripts } from '../src/plugin';
import { Deployer } from '../src/deployer';
import { TASK_DEPLOY_ZKSYNC, TASK_DEPLOY_ZKSYNC_LIBRARIES } from '../src/task-names';
import { useEnvironment } from './helpers';
import { ETH_NETWORK_RPC_URL, ZKSYNC_NETWORK_RPC_URL, ZKSYNC_NETWORK_NAME, WALLET_PRIVATE_KEY } from './constants';
import '@matterlabs/hardhat-zksync-solc/dist/src/type-extensions';

describe('Plugin tests', async function () {
    describe('successful-compilation artifact', async function () {
        useEnvironment('successful-compilation');

        it('Should load artifacts', async function () {
            const artifactExists = await this.env.artifacts.artifactExists('Greeter');
            assert(artifactExists, "Greeter artifact doesn't exist");

            const artifact = await this.env.artifacts.readArtifact('Greeter');
            assert.equal(artifact._format, 'hh-zksolc-artifact-1', 'Incorrect artifact build');

            // Check that we can load an additional key (it turns that we can which is great).
            assert.equal((artifact as any)._additionalKey, 'some_value', 'Additional key not loaded!');
        });

        it('Should find deploy scripts', async function () {
            const baseDir = this.env.config.paths.root;
            const files = findDeployScripts(this.env);

            assert.deepEqual(files, [path.join(baseDir, 'deploy', '001_deploy.ts')], 'Incorrect deploy script list');
        });

        it('Should call deploy scripts', async function () {
            await callDeployScripts(this.env, '');
        });

        it('Should call deploy script', async function () {
            await callDeployScripts(this.env, '001_deploy.ts');
        });

        it('Should call deploy scripts through HRE', async function () {
            await this.env.run(TASK_DEPLOY_ZKSYNC);
        });
    });

    describe('Missing deploy folder', async function () {
        useEnvironment('missing-deploy-folder');

        it('Should not find deploy scripts', async function () {
            try {
                const _files = findDeployScripts(this.env);
                assert.fail('Expected ZkSyncDeployPluginError was not thrown');
            } catch (error: any) {
                assert.strictEqual(error.message, 'No deploy folder was found', 'Error message does not match');
            }
        });
    });

    describe('noninline-libraries artifact', async function () {
        useEnvironment('noninline-libraries-v1', 'zkSyncNetwork');

        it('Should compile libraries', async function () {
            const libraries = this.env.config.zksolc.settings.libraries;
            assert.deepEqual(libraries, {}, 'Libraries present in hardhat config. Delete them!');
            chalk.yellow('Compiling libraries...');
            await this.env.run('compile');
        });

        it('Should deploy libraries with private key', async function () {
            assert.deepEqual(
                this.env.config.zksolc.settings.libraries,
                {},
                'Libraries must not be present in hardhat config. Delete them!',
            );
            chalk.yellow('Deploying libraries...');
            await this.env.run(TASK_DEPLOY_ZKSYNC_LIBRARIES, {
                privateKey: '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110',
            });
        });
    });

    describe('noninline-libraries artifact with private key in config', async function () {
        useEnvironment('noninline-libraries-v2', 'zkSyncNetwork');

        it('Should compile libraries', async function () {
            const libraries = this.env.config.zksolc.settings.libraries;
            assert.deepEqual(libraries, {}, 'Libraries present in hardhat config. Delete them!');
            chalk.yellow('Compiling libraries...');
            await this.env.run('compile');
        });

        it('Should deploy libraries with private key in hardhat.config', async function () {
            assert.deepEqual(
                this.env.config.zksolc.settings.libraries,
                {},
                'Libraries must not be present in hardhat config. Delete them!',
            );
            chalk.yellow('Deploying libraries...');
            await this.env.run(TASK_DEPLOY_ZKSYNC_LIBRARIES, { compileAllContracts: true });
        });
    });

    describe('should deploy libraries using mnemonic', async function () {
        useEnvironment('deployment-with-mnemonic', 'zkSyncNetwork');

        it('Should compile libraries', async function () {
            const libraries = this.env.config.zksolc.settings.libraries;
            assert.deepEqual(libraries, {}, 'Libraries present in hardhat config. Delete them!');
            chalk.yellow('Compiling libraries...');
            await this.env.run('compile');
        });
    });

    describe('Deployer with zkSync network provided', async function () {
        useEnvironment('successful-compilation', ZKSYNC_NETWORK_NAME);

        it('Should connect to correct L1 and L2 networks based on zkSync network', async function () {
            const zkWallet = new Wallet(WALLET_PRIVATE_KEY);
            const deployer = new Deployer(this.env, zkWallet);

            assert.equal(
                (deployer.ethWallet.provider as ethers.providers.JsonRpcProvider).connection.url,
                ETH_NETWORK_RPC_URL,
                'Incorrect L1 network url',
            );
            assert.equal(deployer.zkWallet.provider.connection.url, ZKSYNC_NETWORK_RPC_URL, 'Incorrect L2 network url');
        });
    });

    describe('Deployer without zkSync network provided', async function () {
        useEnvironment('successful-compilation');

        it('Should use default L1 and L2 network providers (local-setup)', async function () {
            const zkWallet = new Wallet(WALLET_PRIVATE_KEY);
            const deployer = new Deployer(this.env, zkWallet);

            assert.equal(
                (deployer.ethWallet.provider as ethers.providers.JsonRpcProvider).connection.url,
                'http://localhost:8545',
                'Incorrect default L1 network provider',
            );
            assert.equal(
                deployer.zkWallet.provider.connection.url,
                'http://localhost:3050',
                'Incorrect default L2 network provider',
            );
        });
    });

    describe('Test plugin functionalities', async function () {
        useEnvironment('plugin-functionalities');

        it('Should use the provider from the wallet instance passed as an argument', async function () {
            const MOCKED_PROVIDER_URL = 'http://localhost:1234';
            const provider: Provider = new Provider(MOCKED_PROVIDER_URL);

            const zkWallet = new Wallet(WALLET_PRIVATE_KEY, provider);
            const deployer = new Deployer(this.env, zkWallet);

            assert.equal(
                deployer.zkWallet.provider.connection.url,
                MOCKED_PROVIDER_URL,
                'Incorrect default L2 network provider',
            );
        });

        it('Should not find the deploy function', async function () {
            const targetScript = '002_deploy.ts';

            try {
                await callDeployScripts(this.env, targetScript);
                assert.fail('Function did not throw expected error');
            } catch (error: any) {
                const expectedMessage = `Script ${targetScript} was not found, no scripts were run`;
                assert.include(
                    error.message,
                    expectedMessage,
                    `Error message does not contain expected text: ${error.message}`,
                );
            }
        });

        it('Should not find deploy function', async function () {
            try {
                await callDeployScripts(this.env, 'invalid_script.ts');
                assert.fail('Function did not throw expected error');
            } catch (error: any) {
                assert.include(
                    error.message,
                    'Deploy function does not exist or exported invalidly',
                    `Error message does not contain expected text: ${error.message}`,
                );
            }
        });

        it('Should estimate deploy fee', async function () {
            const zkWallet = new Wallet(WALLET_PRIVATE_KEY);
            const deployer = new Deployer(this.env, zkWallet);
            await this.env.run('compile');
            const artifact = await deployer.loadArtifact('Greeter');
            const result = await deployer.estimateDeployFee(artifact, ['Hi there!']);
            expect(result._isBigNumber);
        });
    });

    describe('Test not zksync network', async function () {
        useEnvironment('not-zksync-network');

        it('Should fail deploying because zksync is not set to true', async function () {
            try {
                await callDeployScripts(this.env, '001_deploy.ts');
                throw new Error('Expected an error but none was thrown');
            } catch (error: any) {
                expect(error.message).to.include("'zksync' flag set to 'true'");
            }
        });
    });

    describe('Test wrong compiler used', async function () {
        useEnvironment('non-successfull-compilation');

        it('should fail because wrong compiler is used for compilation of contract', async function () {
            const zkWallet = new Wallet(WALLET_PRIVATE_KEY);
            const deployer = new Deployer(this.env, zkWallet);
            await this.env.run('compile');
            let errorOccurred = false;
            try {
                const _ = await deployer.loadArtifact('Greeter');
            } catch (error: any) {
                errorOccurred = true;
                expect(error.message).to.include('Artifact Greeter was not compiled by zksolc or zkvyper');
            }

            expect(errorOccurred).to.equal(true);
        });
    });
});
