import { assert } from 'chai';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { ZkSyncArtifact } from '../src/types';
import { ethers } from 'ethers';

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

    describe('Factory', async function () {
        useEnvironment('factory');

        it('Should successfully compile the factory contract', async function () {
            process.env.FORWARDER_CONTRACT_BYTECODE_HASH = ethers.constants.AddressZero;

            await this.env.run(TASK_COMPILE);

            const factoryArtifact = this.env.artifacts.readArtifactSync(
                'contracts/CreateForwarder.vy:CreateForwarder'
            ) as ZkSyncArtifact;
            const depArtifact = this.env.artifacts.readArtifactSync('contracts/DeployMe.vy:DeployMe') as ZkSyncArtifact;

            assert.equal(factoryArtifact.contractName, 'CreateForwarder');
            assert.equal(depArtifact.contractName, 'DeployMe');

            // TODO: find out if we need factoryDeps here at all, considering Vyper's create model.
            // Check that zkSync-specific artifact information was added.

            // Factory contract should have one dependency.
            // We do not check for the actual value of the hash, as it depends on the bytecode yielded by the compiler and thus not static.
            // Instead we only check that it's a hash indeed.
            // const depHash = Object.keys(factoryArtifact.factoryDeps)[0];
            // const expectedLength = 32 * 2 + 2; // 32 bytes in hex + '0x'.
            // assert(depHash.startsWith('0x') && depHash.length === expectedLength, 'Contract hash is malformed');
            //
            // const depName = 'contracts/DeployMe.vy:DeployMe';
            // assert.equal(depName, factoryArtifact.factoryDeps[depHash], 'No required dependency in the artifact');
            //
            // // For the dependency contract should be no further dependencies.
            // assert.deepEqual(depArtifact.factoryDeps, {}, 'Unexpected factory-deps for a dependency contract');
        });
    });
});
