import { assert, expect } from 'chai';
import * as path from 'path';
import { ethers } from 'ethers';
import { Provider, Wallet } from 'zksync-ethers';
import chalk from 'chalk';
import { TASK_DEPLOY_ZKSYNC, TASK_DEPLOY_ZKSYNC_LIBRARIES } from '../../src/task-names';
import { Deployer } from '../../src/deployer';
import { useEnvironment } from '../helpers';
import { ETH_NETWORK_RPC_URL, ZKSYNC_NETWORK_RPC_URL, ZKSYNC_NETWORK_NAME, WALLET_PRIVATE_KEY } from '../constants';

describe('Plugin tests', async function () {
    describe('successful-compilation artifact', function () {
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
            const files = await this.scriptManager.findAllDeployScripts();
            assert.deepEqual(files, ['deploy/001_deploy.ts'], 'Incorrect deploy script list');
        });

        it('Should call deploy scripts', async function () {
            await this.scriptManager.callDeployScripts('');
        });

        it('Should call deploy provided script', async function () {
            await this.scriptManager.callDeployScripts('001_deploy.ts');
        });

        it('Should call deploy scripts through HRE', async function () {
            await this.env.run(TASK_DEPLOY_ZKSYNC);
        });
    });

    describe('Missing deploy folder', async function () {
        useEnvironment('missing-deploy-folder');

        it('Should not find deploy scripts', async function () {
            try {
                const _files = await this.scriptManager.findAllDeployScripts();
                assert.fail('Expected ZkSyncDeployPluginError was not thrown');
            } catch (error: any) {
                assert.include(error.message, `Deploy folder 'deploy' not found.`, 'Error message does not match');
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
                privateKeyOrIndex: '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110',
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

        it('Should deploy libraries with private key in hardhat.config', async function () {
            assert.deepEqual(
                this.env.config.zksolc.settings.libraries,
                {},
                'Libraries must not be present in hardhat config. Delete them!',
            );
            chalk.yellow('Deploying libraries...');
            await this.env.run(TASK_DEPLOY_ZKSYNC_LIBRARIES, { noAutoPopulateConfig: true });
        });
    });

    describe('Deployer with zkSync network provided', async function () {
        useEnvironment('successful-compilation', ZKSYNC_NETWORK_NAME);

        it('Should connect to correct L1 and L2 networks based on zkSync network', async function () {
            const zkWallet = new Wallet(WALLET_PRIVATE_KEY);
            const deployer = new Deployer(this.env, zkWallet);

            assert.equal(
                (deployer.ethWallet.provider as ethers.JsonRpcProvider)._getConnection().url,
                ETH_NETWORK_RPC_URL,
                'Incorrect L1 network url',
            );
            assert.equal(
                deployer.zkWallet.provider._getConnection().url,
                ZKSYNC_NETWORK_RPC_URL,
                'Incorrect L2 network url',
            );
        });
    });

    describe('Deployer without zkSync network provided', async function () {
        useEnvironment('successful-compilation');

        it('Should use default L1 and L2 network providers (local-setup)', async function () {
            const zkWallet = new Wallet(WALLET_PRIVATE_KEY);
            const deployer = new Deployer(this.env, zkWallet);

            assert.equal(
                (deployer.ethWallet.provider as ethers.JsonRpcProvider)._getConnection().url,
                'http://localhost:8545',
                'Incorrect default L1 network provider',
            );
            assert(
                ['http://localhost:3050', 'http://localhost:8011'].includes(
                    deployer.zkWallet.provider._getConnection().url,
                ),
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
                deployer.zkWallet.provider._getConnection().url,
                MOCKED_PROVIDER_URL,
                'Incorrect default L2 network provider',
            );
        });

        it('Should not find the deploy function', async function () {
            const targetScript = '002_deploy.ts';

            try {
                await this.scriptManager.callDeployScripts(targetScript);
                assert.fail('Function did not throw expected error');
            } catch (error: any) {
                const expectedMessage = `Deploy script '${targetScript}' not found, in deploy folders:`;
                assert.include(
                    error.message,
                    expectedMessage,
                    `Error message does not contain expected text: ${error.message}`,
                );
            }
        });

        it('Should not find deploy function', async function () {
            try {
                await this.scriptManager.callDeployScripts('invalid_script.ts');
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
            expect(typeof result).to.equal('bigint');
        });
    });

    describe('Test not zksync network', async function () {
        useEnvironment('not-zksync-network');

        it('Should fail deploying because zksync is not set to true', async function () {
            try {
                await this.scriptManager.callDeployScripts('001_deploy.ts');
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

    describe('Test with integritated deployer in hre', async function () {
        useEnvironment('deployer-in-hre', 'zkSyncNetwork2');

        it('should deploy with integrated wallet', async function () {
            await this.env.run('compile');
            const contract = await this.env.deployer.deploy('Greeter', ['Hi there!']);
            const wallet = contract.runner as Wallet;
            expect(wallet.address).to.be.equal('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');
            expect(contract).to.be.an('object');
            expect(await contract.getAddress()).to.be.a('string');
            const walletFromDeployer = await this.env.deployer.getWallet();
            expect(walletFromDeployer.address).to.be.equal('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');
        });

        it('should deploy with provided wallet', async function () {
            await this.env.run('compile');
            const artifact = await this.env.deployer.loadArtifact('Greeter');
            const wallet = await this.env.deployer.getWallet(4);
            this.env.deployer.setWallet(wallet);
            const contract = await this.env.deployer.deploy(artifact, ['Hi there!']);
            const walletRunner = contract.runner as Wallet;
            expect(walletRunner.address).to.be.equal('0x8002cD98Cfb563492A6fB3E7C8243b7B9Ad4cc92');
            expect(contract).to.be.an('object');
            expect(await contract.getAddress()).to.be.a('string');
        });

        it('should deploy scripts with integrated deployer', async function () {
            await this.env.run('compile');
            await this.env.run('deploy-zksync');
        });
    });

    describe('Deply scripts with tags and dependencies', async function () {
        useEnvironment('tags-and-dependecies');

        it('Should collect specified tags', async function () {
            const scripts = await this.scriptManager.findAllDeployScripts();
            const filePathsByTag = await this.scriptManager.collectTags(scripts);

            assert.deepEqual(
                Object.keys(filePathsByTag),
                ['second', 'all', 'third', 'first', 'default'],
                "Collected tags don't match",
            );
        });

        it('Should match tags with file paths', async function () {
            const baseDir = this.env.config.paths.root;
            const scripts = await this.scriptManager.findAllDeployScripts();
            const filePathsByTag = await this.scriptManager.collectTags(scripts);

            const firstTagFilePaths = [path.join(baseDir, 'deploy-scripts', '003_deploy.ts')];
            const secondTagFilePaths = [path.join(baseDir, 'deploy-scripts', '001_deploy.ts')];
            const thirdTagFilePaths = [path.join(baseDir, 'deploy-scripts', '002_deploy.js')];
            const allTagFilePaths = [
                path.join(baseDir, 'deploy-scripts', '001_deploy.ts'),
                path.join(baseDir, 'deploy-scripts', '002_deploy.js'),
                path.join(baseDir, 'deploy-scripts', '003_deploy.ts'),
            ];

            assert.deepEqual(filePathsByTag.first, firstTagFilePaths, 'Incorrect file paths list by tag');
            assert.deepEqual(filePathsByTag.second, secondTagFilePaths, 'Incorrect file paths list by tag');
            assert.deepEqual(filePathsByTag.third, thirdTagFilePaths, 'Incorrect file paths list by tag');
            assert.deepEqual(filePathsByTag.all, allTagFilePaths, 'Incorrect file paths list by tag');
        });

        it('Should filter scripts to run by specified tags, when collecting', async function () {
            const baseDir = this.env.config.paths.root;
            const scripts = await this.scriptManager.findAllDeployScripts();

            const firstTagFilePaths = [path.join(baseDir, 'deploy-scripts', '003_deploy.ts')];
            const secondTagFilePaths = [path.join(baseDir, 'deploy-scripts', '001_deploy.ts')];
            const thirdTagFilePaths = [path.join(baseDir, 'deploy-scripts', '002_deploy.js')];
            const allTagFilePaths = [
                path.join(baseDir, 'deploy-scripts', '003_deploy.ts'),
                path.join(baseDir, 'deploy-scripts', '001_deploy.ts'),
                path.join(baseDir, 'deploy-scripts', '002_deploy.js'),
            ];

            const withoutTagAllScripts = [
                path.join(baseDir, 'deploy-scripts', '003_deploy.ts'),
                path.join(baseDir, 'deploy-scripts', '001_deploy.ts'),
                path.join(baseDir, 'deploy-scripts', '002_deploy.js'),
                path.join(baseDir, 'deploy-scripts', '004_deploy.ts'),
            ];

            let filePathsByTag = await this.scriptManager.collectTags(scripts, ['first']);
            let scriptsToRun = await this.scriptManager.getScriptsToRun(filePathsByTag);
            assert.deepEqual(
                scriptsToRun,
                firstTagFilePaths,
                "List of scripts to run doesn't match with filtered file paths",
            );

            filePathsByTag = await this.scriptManager.collectTags(scripts, ['all']);
            scriptsToRun = await this.scriptManager.getScriptsToRun(filePathsByTag);
            assert.deepEqual(
                scriptsToRun,
                allTagFilePaths,
                "List of scripts to run doesn't match with filtered file paths",
            );

            filePathsByTag = await this.scriptManager.collectTags(scripts, ['first', 'second']);
            scriptsToRun = await this.scriptManager.getScriptsToRun(filePathsByTag);
            assert.deepEqual(
                scriptsToRun,
                firstTagFilePaths.concat(secondTagFilePaths),
                "List of scripts to run doesn't match with filtered file paths",
            );

            filePathsByTag = await this.scriptManager.collectTags(scripts, ['first', 'second', 'third']);
            scriptsToRun = await this.scriptManager.getScriptsToRun(filePathsByTag);
            assert.deepEqual(
                scriptsToRun,
                firstTagFilePaths.concat(secondTagFilePaths).concat(thirdTagFilePaths),
                "List of scripts to run doesn't match with filtered file paths",
            );

            filePathsByTag = await this.scriptManager.collectTags(scripts);
            scriptsToRun = await this.scriptManager.getScriptsToRun(filePathsByTag);
            assert.deepEqual(scriptsToRun, withoutTagAllScripts, 'List of all scripts without tag specified!');
        });

        it('Should run scripts in specified order', async function () {
            const baseDir = this.env.config.paths.root;
            const scripts = await this.scriptManager.findAllDeployScripts();

            const expectedScriptToRunOrder = [
                path.join(baseDir, 'deploy-scripts', '003_deploy.ts'), // first tag
                path.join(baseDir, 'deploy-scripts', '001_deploy.ts'), // second tag
                path.join(baseDir, 'deploy-scripts', '002_deploy.js'), // third tag
                path.join(baseDir, 'deploy-scripts', '004_deploy.ts'), // wthout tag
            ];

            const filePathsByTag = await this.scriptManager.collectTags(scripts);
            const scriptsToRun = await this.scriptManager.getScriptsToRun(filePathsByTag);

            assert.deepEqual(scriptsToRun, expectedScriptToRunOrder, "Order of executing scripts doesn't match");
        });
    });

    describe('Deply scripts with priority for all deploy folders', async function () {
        useEnvironment('priority', 'zkSyncNetwork');
        it('Should run scripts is order with priority', async function () {
            const baseDir = this.env.config.paths.root;

            const expectedScriptToRunOrder = [
                path.join(baseDir, 'deploy-scripts', '001_deploy.ts'), // 1200
                path.join(baseDir, 'deploy-scripts', '004_deploy.ts'), // 1000
                path.join(baseDir, 'dependent-scripts', '006_deploy.ts'), // 650 but 005_deploy.ts is dependent
                path.join(baseDir, 'dependent-scripts', '005_deploy.ts'), // 800
                path.join(baseDir, 'deploy-scripts', '003_deploy.ts'), // default 500
                path.join(baseDir, 'deploy-scripts', '002_deploy.js'), // 400
            ];

            const scripts = await this.scriptManager.findAllDeployScripts();
            const filePathsByTag = await this.scriptManager.collectTags(scripts);
            const scriptsToRun = await this.scriptManager.getScriptsToRun(filePathsByTag);

            assert.deepEqual(scriptsToRun, expectedScriptToRunOrder, "Order of executing scripts doesn't match");
        });
    });

    describe('Deply scripts with priority for all deploy-scripts folders', function () {
        useEnvironment('priority', 'hardhat');

        it('Should run scripts is order with priority', async function () {
            const baseDir = this.env.config.paths.root;

            const expectedScriptToRunOrder = [
                path.join(baseDir, 'deploy-scripts', '001_deploy.ts'), // 1200
                path.join(baseDir, 'deploy-scripts', '004_deploy.ts'), // 1000
                path.join(baseDir, 'deploy-scripts', '003_deploy.ts'), // default 500
                path.join(baseDir, 'deploy-scripts', '002_deploy.js'), // 400
            ];

            const scripts = await this.scriptManager.findAllDeployScripts();
            const filePathsByTag = await this.scriptManager.collectTags(scripts);
            const scriptsToRun = await this.scriptManager.getScriptsToRun(filePathsByTag);

            assert.deepEqual(scriptsToRun, expectedScriptToRunOrder, "Order of executing scripts doesn't match");
        });
    });
});
