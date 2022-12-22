import { assert, expect } from 'chai';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { ZkSyncArtifact } from '../src/types';
import { useEnvironment } from './helpers';
import { spy } from 'sinon';
import chalk from 'chalk';

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

    describe('Factory', async function () {
        useEnvironment('factory');

        it('Should successfully compile the factory contract', async function () {
            await this.env.run(TASK_COMPILE);

            const factoryArtifact = this.env.artifacts.readArtifactSync(
                'contracts/CreateForwarder.vy:CreateForwarder'
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
                'No required dependency in the artifact'
            );

            // For the dependency contract should be no further dependencies.
            assert.deepEqual(depArtifact.factoryDeps, {}, 'Unexpected factory-deps for a dependency contract');

            // Check that the forwarder artifact was saved correctly.
            const forwarderArtifact = this.env.artifacts.readArtifactSync(
                '.__VYPER_FORWARDER_CONTRACT:__VYPER_FORWARDER_CONTRACT'
            ) as ZkSyncArtifact;
            assert.equal(forwarderArtifact.contractName, '__VYPER_FORWARDER_CONTRACT');
        });
    });

    describe('Output', async function () {
        useEnvironment('output');

        it('Should successfully compile both solidity and vyper contracts and match their log outputs', async function () {
            let consoleSpy = spy(console, 'info');
            await this.env.run(TASK_COMPILE);

            expect(
                consoleSpy.calledWith(chalk.green('Successfully compiled 3 Solidity files and 1 Vyper file'))
            ).to.equal(true);
            consoleSpy.restore();
        });
    });
});
