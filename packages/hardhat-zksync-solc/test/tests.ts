import { assert } from 'chai';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { ZkSyncArtifact } from '../src/types';
import chalk from 'chalk';

import { useEnvironment } from './helpers';

describe('zksolc plugin', async function () {
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

    describe('Inlined library', async function () {
        useEnvironment('library');

        it('Should successfully compile the contract with inlined library', async function () {
            if (this.env.config.solidity.compilers[0].version.startsWith('0.4')) {
                console.info(chalk.cyan('Test skipped since is not applicable to Solidity 0.4.x.'));
                return;
            }
            await this.env.run(TASK_COMPILE);
            assert.equal(this.env.artifacts.readArtifactSync('contracts/Foo.sol:Foo').contractName, 'Foo');
            assert.equal(this.env.artifacts.readArtifactSync('contracts/Import.sol:Import').contractName, 'Import');
        });
    });

    describe('Linked library', async function () {
        useEnvironment('linked');

        it('Should successfully compile the contract with linked library', async function () {
            if (this.env.config.solidity.compilers[0].version.startsWith('0.4')) {
                console.info(chalk.cyan('Test skipped since is not applicable to Solidity 0.4.x.'));
                return;
            }
            await this.env.run(TASK_COMPILE);
            assert.equal(this.env.artifacts.readArtifactSync('contracts/Foo.sol:Foo').contractName, 'Foo');
            assert.equal(this.env.artifacts.readArtifactSync('contracts/Import.sol:Import').contractName, 'Import');
        });
    });

    describe('Factory', async function () {
        useEnvironment('factory');

        it('Should successfully compile the factory contract', async function () {
            await this.env.run(TASK_COMPILE);

            const factoryArtifact = this.env.artifacts.readArtifactSync(
                'contracts/Factory.sol:Factory'
            ) as ZkSyncArtifact;
            const depArtifact = this.env.artifacts.readArtifactSync('contracts/Factory.sol:Dep') as ZkSyncArtifact;

            assert.equal(factoryArtifact.contractName, 'Factory');
            assert.equal(depArtifact.contractName, 'Dep');

            // Check that zkSync-specific artifact information was added.

            // Factory contract should have one dependency.
            // We do not check for the actual value of the hash, as it depends on the bytecode yielded by the compiler and thus not static.
            // Instead we only check that it's a hash indeed.
            const depHash = Object.keys(factoryArtifact.factoryDeps)[0];
            const expectedLength = 32 * 2 + 2; // 32 bytes in hex + '0x'.
            assert(depHash.startsWith('0x') && depHash.length === expectedLength, 'Contract hash is malformed');

            const depName = 'contracts/Factory.sol:Dep';
            assert.equal(depName, factoryArtifact.factoryDeps[depHash], 'No required dependency in the artifact');

            // For the dependency contract should be no further dependencies.
            assert.deepEqual(depArtifact.factoryDeps, {}, 'Unexpected factory-deps for a dependency contract');
        });
    });

    describe('Nested Factory', async function () {
        useEnvironment('nested');

        it('Should successfully compile nested contracts', async function () {
            await this.env.run(TASK_COMPILE);

            const factoryArtifact = this.env.artifacts.readArtifactSync('NestedFactory') as ZkSyncArtifact;
            const fooDepArtifact = this.env.artifacts.readArtifactSync(
                'contracts/deps/Foo.sol:FooDep'
            ) as ZkSyncArtifact;
            const barDepArtifact = this.env.artifacts.readArtifactSync(
                'contracts/deps/more_deps/Bar.sol:BarDep'
            ) as ZkSyncArtifact;

            // Check that zkSync-specific artifact information was added.

            // Factory contract should have one dependency.
            // We do not check for the actual value of the hash, as it depends on the bytecode yielded by the compiler and thus not static.
            // Instead we only check that it's a hash indeed.
            const fooDepName = 'contracts/deps/Foo.sol:FooDep';
            const barDepName = 'contracts/deps/more_deps/Bar.sol:BarDep';
            for (const depName of [fooDepName, barDepName]) {
                assert(
                    Object.values(factoryArtifact.factoryDeps).includes(depName),
                    `No required dependency in the artifact: ${depName}`
                );
            }
            for (const depHash in factoryArtifact.factoryDeps) {
                const expectedLength = 32 * 2 + 2; // 32 bytes in hex + '0x'.
                assert(depHash.startsWith('0x') && depHash.length === expectedLength, 'Contract hash is malformed');
            }

            // For the dependency contract should be no further dependencies.
            for (const depArtifact of [fooDepArtifact, barDepArtifact]) {
                assert.deepEqual(depArtifact.factoryDeps, {}, 'Unexpected factory-deps for a dependency contract');
            }

            // Each factory dependency should be accessible through `readArtifact` without changing it's identifier.
            const fooDepArtifactFromFactoryDeps = this.env.artifacts.readArtifactSync(fooDepName);
            assert.equal(
                fooDepArtifactFromFactoryDeps.contractName,
                fooDepArtifact.contractName,
                'Artifacts do not match'
            );
            assert.equal(fooDepArtifactFromFactoryDeps.bytecode, fooDepArtifact.bytecode, 'Artifacts do not match');
            assert.deepEqual(fooDepArtifactFromFactoryDeps.abi, fooDepArtifact.abi, 'Artifacts do not match');
        });
    });
});
