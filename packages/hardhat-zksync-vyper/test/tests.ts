import { assert, expect } from 'chai';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { spy } from 'sinon';
import chalk from 'chalk';
import { ZkSyncArtifact } from '../src/types';
import { useEnvironment } from './helpers';

describe('zkvyper plugin', async function () {
    describe('Simple', async function () {
        useEnvironment('simple');

        it('Should successfully compile a simple contract', async function () {
            await this.env.run(TASK_COMPILE);

            const artifact = this.env.artifacts.readArtifactSync('Greeter') as ZkSyncArtifact;

            assert.equal(artifact.contractName, 'Greeter');

            // Check that zkSync-specific artifact information was added.
            assert.deepEqual(artifact.factoryDeps, {}, 'Contract unexpectedly has dependencies');
        });
    });

    describe('Simple on otherNetwork', async function () {
        useEnvironment('simple', 'otherNetwork');

        it('Should successfully compile a simple contract on otherNetwork', async function () {
            await this.env.run(TASK_COMPILE);

            const artifact = this.env.artifacts.readArtifactSync('Greeter') as ZkSyncArtifact;

            assert.deepEqual(artifact.factoryDeps, undefined, 'Contract should not have factoryDeps');
        });
    });

    describe('Simple using docker without image', async function () {
        useEnvironment('simple-docker-no-image');

        it('Should fail to compile a simple contract', async function () {
            try {
                await this.env.run(TASK_COMPILE);
                const artifact = this.env.artifacts.readArtifactSync('Greeter') as ZkSyncArtifact;

                assert.equal(artifact.contractName, 'Greeter');
            } catch (e: any) {
                expect(e.message).to.include('Docker source was chosen but no image was specified');
            }
        });
    });

    describe('Simple using docker', async function () {
        useEnvironment('simple-docker');

        it('Should compile a simple contract', async function () {
            await this.env.run(TASK_COMPILE);
            const artifact = this.env.artifacts.readArtifactSync('Greeter') as ZkSyncArtifact;

            assert.equal(artifact.contractName, 'Greeter');
        });
    });

    describe('Should not download', async function () {
        useEnvironment('unsupported-vyper', 'hardhat', true);

        it('Should not download vyper compiler', async function () {
            try {
                const hh = require('hardhat');
                await hh.run(TASK_COMPILE);
            } catch (e: any) {
                expect(e.message).to.include('Vyper versions 0.3.4 to 0.3.7 are not supported by zkvyper');
            }
        });
    });

    describe('Should not download', async function () {
        useEnvironment('unsupported-zkvyper', 'hardhat', true);

        it('Should not download zkvyper compiler', async function () {
            try {
                const hh = require('hardhat');
                await hh.run(TASK_COMPILE);
            } catch (e: any) {
                console.info(e.message);
                expect(e.message).to.include('Please use versions 1.3.9 to 1.3.14');
            }
        });
    });

    describe('Compiling nothing', async function () {
        useEnvironment('nothing-to-compile');

        it('Should not compile anything', async function () {
            let isError = false;
            try {
                await this.env.run(TASK_COMPILE);
            } catch (e: any) {
                isError = true;
                console.info(e);
            }
            assert(isError === false);
        });
    });

    describe('Factory', async function () {
        useEnvironment('factory');

        it('Should successfully compile the factory contract', async function () {
            await this.env.run(TASK_COMPILE);

            const factoryArtifact = this.env.artifacts.readArtifactSync(
                'contracts/CreateForwarder.vy:CreateForwarder',
            ) as ZkSyncArtifact;
            const depArtifact = this.env.artifacts.readArtifactSync('contracts/DeployMe.vy:DeployMe') as ZkSyncArtifact;

            assert.equal(factoryArtifact.contractName, 'CreateForwarder');
            assert.equal(depArtifact.contractName, 'DeployMe');

            // Check that zkSync-specific artifact information was added.

            // Factory contract should have one dependency.
            // We do not check for the actual value of the hash, as it depends on the bytecode yielded by the compiler and thus not static.
            // Instead we only check that it's a hash indeed.
            const depHash = Object.keys(factoryArtifact.factoryDeps)[0];
            const expectedLength = 32 * 2 + 2; // 32 bytes in hex + '0x'.
            assert(depHash.startsWith('0x') && depHash.length === expectedLength, 'Contract hash is malformed');
            assert.equal(
                '.__VYPER_FORWARDER_CONTRACT:__VYPER_FORWARDER_CONTRACT',
                factoryArtifact.factoryDeps[depHash],
                'No required dependency in the artifact',
            );

            // For the dependency contract should be no further dependencies.
            assert.deepEqual(depArtifact.factoryDeps, {}, 'Unexpected factory-deps for a dependency contract');

            // Check that the forwarder artifact was saved correctly.
            const forwarderArtifact = this.env.artifacts.readArtifactSync(
                '.__VYPER_FORWARDER_CONTRACT:__VYPER_FORWARDER_CONTRACT',
            ) as ZkSyncArtifact;
            assert.equal(forwarderArtifact.contractName, '__VYPER_FORWARDER_CONTRACT');
        });
    });

    describe('Output', async function () {
        useEnvironment('output');

        it('Should successfully compile both solidity and vyper contracts and match their log outputs', async function () {
            const consoleSpy = spy(console, 'info');
            await this.env.run(TASK_COMPILE);

            expect(
                consoleSpy.calledWith(chalk.green('Successfully compiled 3 Solidity files and 1 Vyper file')),
            ).to.equal(true);
            consoleSpy.restore();
        });
    });
});
