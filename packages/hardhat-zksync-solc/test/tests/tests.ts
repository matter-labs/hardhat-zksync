import {
    TASK_COMPILE,
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS,
    TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
} from 'hardhat/builtin-tasks/task-names';
import chalk from 'chalk';
import fs from 'fs';
import sinonChai from 'sinon-chai';
import chai, { assert } from 'chai';

import { DependencyGraph } from 'hardhat/types/builtin-tasks/compile';
import path from 'path';
import { SOLIDITY_FILES_CACHE_FILENAME } from 'hardhat/internal/constants';
import sinon from 'sinon';
import { CompilerDownloader } from 'hardhat/internal/solidity/compiler/downloader';
import { ZksolcCompilerDownloader } from '../../src/compile/downloader';
import { useEnvironment } from '../helpers';
import { ZkSyncArtifact } from '../../src/types';

chai.use(sinonChai);

describe('zksolc plugin', async function () {
    describe('Extend HRE', async function () {
        useEnvironment('multiple-compilers');

        it('Should extend environment', async function () {
            assert.isDefined(this.env.config.zksolc);
            assert.isDefined(this.env.config.zksolc.settings);
            assert.isDefined(this.env.config.zksolc.settings.libraries);
            assert.isDefined(this.env.config.zksolc.settings.missingLibrariesPath);

            assert.include(this.env.config.paths.artifacts, '/fixture-projects/multiple-compilers/artifacts-zk');
            assert.include(this.env.config.paths.cache, '/fixture-projects/multiple-compilers/cache-zk');

            const compilers = this.env.config.solidity.compilers;

            assert.equal(compilers.length, 1);
            assert.equal(compilers[0].version, '0.8.17');
            assert.equal(compilers[0].settings.optimizer.enabled, true);

            const overrides = this.env.config.solidity.overrides;
            assert.equal(overrides['contracts/Greeter2.sol'].version, '0.8.16');
        });
    });

    describe('Filter contracts', async function () {
        useEnvironment('multiple-contracts');

        it('Should successfully return all contracts for compiling', async function () {
            const rootPath = this.env.config.paths.root;
            const sourcePaths: string[] = [`${rootPath}/contracts/Greeter.sol`, `${rootPath}/contracts/Greeter2.sol`];

            const sourceNames: string[] = await this.env.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, {
                rootPath,
                sourcePaths,
            });

            assert.equal(2, sourceNames.length);
            assert.equal('contracts/Greeter.sol', sourceNames[0]);
            assert.equal('contracts/Greeter2.sol', sourceNames[1]);

            this.env.config.zksolc.settings.contractsToCompile = [];

            const sourceNames1: string[] = await this.env.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, {
                rootPath,
                sourcePaths,
            });

            assert.equal(2, sourceNames1.length);
            assert.equal('contracts/Greeter.sol', sourceNames1[0]);
            assert.equal('contracts/Greeter2.sol', sourceNames1[1]);
        });

        it('Should successfully return only Greeter contracts for compiling', async function () {
            this.env.config.zksolc.settings.contractsToCompile = ['contracts/Greeter.sol'];

            const rootPath = this.env.config.paths.root;
            const sourcePaths: string[] = [`${rootPath}/contracts/Greeter.sol`, `${rootPath}/contracts/Greeter2.sol`];

            const sourceNames: string[] = await this.env.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, {
                rootPath,
                sourcePaths,
            });

            assert.equal(1, sourceNames.length);
            assert.equal('contracts/Greeter.sol', sourceNames[0]);
        });
    });

    describe('Compilation jobs', async function () {
        useEnvironment('multiple-contracts');

        const compilerVersion = process.env.SOLC_VERSION || '0.8.17';

        const sandbox = sinon.createSandbox();

        let isZksolcDownloadedStub: sinon.SinonStub;
        let getZksolcCompilerPathStub: sinon.SinonStub;
        let getZksolcCompilerVersionStub: sinon.SinonStub;
        let downloadCompilerStub: sinon.SinonStub;

        async function isCompilerDownloaded(isZksolcDownloaded: boolean): Promise<boolean> {
            return isZksolcDownloaded;
        }

        beforeEach(() => {
            downloadCompilerStub = sandbox.stub(ZksolcCompilerDownloader.prototype, 'downloadCompiler').resolves();
            getZksolcCompilerPathStub = sandbox
                .stub(ZksolcCompilerDownloader.prototype, 'getCompilerPath')
                .returns('zksolc/zksolc-version-0');
            getZksolcCompilerVersionStub = sandbox
                .stub(ZksolcCompilerDownloader.prototype, 'getVersion')
                .returns('zksolc-version-0');
        });

        afterEach(() => {
            sandbox.restore();
        });

        after(() => {
            (ZksolcCompilerDownloader as any)._instance = undefined;
        });

        it('Should download compiler and update jobs', async function () {
            isZksolcDownloadedStub = sandbox
                .stub(ZksolcCompilerDownloader.prototype, 'isCompilerDownloaded')
                .returns(isCompilerDownloaded(false));

            const rootPath = this.env.config.paths.root;
            const sourceNames: string[] = ['contracts/Greeter.sol', 'contracts/Greeter2.sol'];

            const solidityFilesCachePath = path.join(this.env.config.paths.cache, SOLIDITY_FILES_CACHE_FILENAME);

            const dependencyGraph: DependencyGraph = await this.env.run(TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH, {
                rootPath,
                sourceNames,
                solidityFilesCachePath,
            });

            const { jobs, errors } = await this.env.run(TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS, {
                dependencyGraph,
                solidityFilesCachePath,
            });

            sandbox.assert.calledOnce(isZksolcDownloadedStub);
            sandbox.assert.calledOnce(getZksolcCompilerPathStub);
            sandbox.assert.calledOnce(getZksolcCompilerVersionStub);
            sandbox.assert.calledOnceWithExactly(downloadCompilerStub);

            assert.equal(2, jobs.length);
            assert.equal(0, errors.length);

            jobs.forEach((job: any) => {
                const solidityConfig = job.solidityConfig;
                assert.equal(solidityConfig.version, compilerVersion);
                assert.equal(solidityConfig.zksolc.version, 'zksolc-version-0');
                assert.equal(solidityConfig.zksolc.settings.compilerPath, 'zksolc/zksolc-version-0');
                // assert.equal(solidityConfig.zksolc.settings.libraries, {});
            });
        });

        it('Should not download compiler and update jobs with libraries', async function () {
            isZksolcDownloadedStub = sandbox
                .stub(ZksolcCompilerDownloader.prototype, 'isCompilerDownloaded')
                .returns(isCompilerDownloaded(true));

            const rootPath = this.env.config.paths.root;
            const sourceNames: string[] = ['contracts/Greeter.sol', 'contracts/Greeter2.sol'];

            this.env.config.zksolc.settings.libraries = {
                'contracts/Greeter.sol': {
                    'contracts/Greeter.sol': '0x1234567890123456789012345678901234567890',
                },
            };

            const solidityFilesCachePath = path.join(this.env.config.paths.cache, SOLIDITY_FILES_CACHE_FILENAME);

            const dependencyGraph: DependencyGraph = await this.env.run(TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH, {
                rootPath,
                sourceNames,
                solidityFilesCachePath,
            });

            const { jobs, errors } = await this.env.run(TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS, {
                dependencyGraph,
                solidityFilesCachePath,
            });

            sandbox.assert.calledOnce(isZksolcDownloadedStub);
            sandbox.assert.calledOnce(getZksolcCompilerPathStub);
            sandbox.assert.calledOnce(getZksolcCompilerVersionStub);
            sandbox.assert.notCalled(downloadCompilerStub);

            assert.equal(2, jobs.length);
            assert.equal(0, errors.length);

            jobs.forEach((job: any) => {
                const solidityConfig = job.solidityConfig;
                assert.equal(solidityConfig.version, compilerVersion);
                assert.equal(solidityConfig.zksolc.version, 'zksolc-version-0');
                assert.equal(solidityConfig.zksolc.settings.compilerPath, 'zksolc/zksolc-version-0');
                assert.equal(
                    solidityConfig.zksolc.settings.libraries['contracts/Greeter.sol']['contracts/Greeter.sol'],
                    '0x1234567890123456789012345678901234567890',
                );
            });
        });
    });

    describe('Solc build', async function () {
        describe('Solc build for docker', async function () {
            useEnvironment('docker-compile');

            it('Should get solc build for docker compiler', async function () {
                const build = await this.env.run(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, {
                    quiet: true,
                    solcVersion: '0.8.17',
                });

                assert.equal(build.compilerPath, '');
                assert.equal(build.isSolsJs, false);
                assert.equal(build.version, '0.8.17');
                assert.equal(build.longVersion, '');
            });
        });
        describe('Solc build for binary', async function () {
            useEnvironment('multiple-contracts');
            const sandbox = sinon.createSandbox();

            async function isCompilerDownloaded(): Promise<boolean> {
                return true;
            }

            beforeEach(() => {
                sandbox.stub(CompilerDownloader.prototype, 'isCompilerDownloaded').returns(isCompilerDownloaded());
                sandbox.stub(CompilerDownloader.prototype, 'getCompiler').resolves({
                    compilerPath: 'solc/solc-version-0',
                    version: '0.8.17',
                    longVersion: 'solc/solc-version-0-long',
                    isSolcJs: false,
                });
            });

            afterEach(() => {
                sandbox.restore();
            });

            after(() => {
                (ZksolcCompilerDownloader as any)._instance = undefined;
            });

            it('Should get solc build for binary compiler', async function () {
                const build = await this.env.run(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, {
                    quiet: true,
                    solcVersion: '0.8.17',
                });

                assert.equal(build.compilerPath, 'solc/solc-version-0');
                assert.equal(build.isSolcJs, false);
                assert.equal(build.version, '0.8.17');
                assert.equal(build.longVersion, 'solc/solc-version-0-long');
            });
        });
    });

    describe('zksolc plugin compile without zksolc flag', async function () {
        useEnvironment('no-zksync');

        it('Should successfully compile a simple contract without zksync flag', async function () {
            await this.env.run(TASK_COMPILE);

            const artifact = this.env.artifacts.readArtifactSync('Greeter') as ZkSyncArtifact;

            assert.equal(artifact.contractName, 'Greeter');

            // Check that zkSync-specific artifact information was added.
            assert.isUndefined(artifact.factoryDeps);
            assert.isTrue(fs.existsSync(this.env.config.paths.cache));
            assert.isTrue(fs.existsSync(this.env.config.paths.artifacts));

            assert.include(this.env.config.paths.artifacts, 'fixture-projects/no-zksync/artifacts');
            assert.include(this.env.config.paths.cache, 'fixture-projects/no-zksync/cache');
        });
    });

    describe('zksolc plugin compile with zksolc flag', async function () {
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
                    'contracts/Factory.sol:Factory',
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
                    'contracts/deps/Foo.sol:FooDep',
                ) as ZkSyncArtifact;
                const barDepArtifact = this.env.artifacts.readArtifactSync(
                    'contracts/deps/more_deps/Bar.sol:BarDep',
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
                        `No required dependency in the artifact: ${depName}`,
                    );
                }
                for (const depHash in factoryArtifact.factoryDeps) {
                    if (!depHash) {
                        continue;
                    }
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
                    'Artifacts do not match',
                );
                assert.equal(fooDepArtifactFromFactoryDeps.bytecode, fooDepArtifact.bytecode, 'Artifacts do not match');
                assert.deepEqual(fooDepArtifactFromFactoryDeps.abi, fooDepArtifact.abi, 'Artifacts do not match');
            });
        });

        describe('Missing Library', async function () {
            useEnvironment('missing-libraries');

            it('Should successfully identify all the missing libraries', async function () {
                if (this.env.config.solidity.compilers[0].version.startsWith('0.4')) {
                    console.info(chalk.cyan('Test skipped since is not applicable to Solidity 0.4.x.'));
                    return;
                }

                await this.env.run(TASK_COMPILE);

                // Assert that there is a json file with the list of missing libraries at the location this.env.config.zksolc.settings.missingLibrariesPath.
                const missingLibraries = JSON.parse(
                    fs.readFileSync(this.env.config.zksolc.settings.missingLibrariesPath!, 'utf8'),
                );
                assert.isNotEmpty(missingLibraries);

                const expectedMissingLibraries = [
                    {
                        contractName: 'ChildChildLib',
                        contractPath: 'contracts/ChildChildLib.sol',
                        missingLibraries: [],
                    },
                    {
                        contractName: 'ChildLib',
                        contractPath: 'contracts/ChildLib.sol',
                        missingLibraries: ['contracts/ChildChildLib.sol:ChildChildLib'],
                    },
                    {
                        contractName: 'MathLib',
                        contractPath: 'contracts/MathLib.sol',
                        missingLibraries: ['contracts/ChildLib.sol:ChildLib'],
                    },
                ];

                // Assert that list of missing libraries is correct.
                assert.deepEqual(missingLibraries, expectedMissingLibraries);
            });

            afterEach(async function () {
                if (this.env.config.solidity.compilers[0].version.startsWith('0.4')) {
                    console.info(chalk.cyan('Test skipped since is not applicable to Solidity 0.4.x.'));
                    return;
                }

                // Remove the file with the list of missing libraries.
                fs.unlinkSync(this.env.config.zksolc.settings.missingLibrariesPath!);
            });
        });
    });
});
