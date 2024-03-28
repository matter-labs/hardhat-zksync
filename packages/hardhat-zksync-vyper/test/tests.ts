import chai, { assert, expect } from 'chai';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import chalk from 'chalk';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import fse from 'fs-extra';
import path from 'path';
import semver from 'semver';
import { compile, getWindowsOutput } from '../src/compile/index';
import * as compiler from '../src/compile/binary';
import { ZkSyncArtifact, ZkVyperConfig, CompilerOutput } from '../src/types';
import { getLatestRelease, getZkvyperUrl, pluralize, saltFromUrl, saveDataToFile, sha1 } from '../src/utils';
import { USER_AGENT, ZKVYPER_BIN_OWNER, ZKVYPER_BIN_REPOSITORY, ZKVYPER_BIN_REPOSITORY_NAME } from '../src/constants';
import { useEnvironment } from './helpers';

chai.use(sinonChai);

describe('zkvyper plugin', async function () {
    it('should get release zkVyper url', async function () {
        const url = getZkvyperUrl(ZKVYPER_BIN_REPOSITORY, '1.3.14');
        assert(
            url ===
                'https://github.com/matter-labs/zkvyper-bin/releases/download/v1.3.14/zkvyper-linux-amd64-musl-v1.3.14',
            'Url is not correct.',
        );
    });

    it('should get zkVyper url', async function () {
        const url = getZkvyperUrl(ZKVYPER_BIN_REPOSITORY, '1.3.14', false);
        assert(
            url === 'https://github.com/matter-labs/zkvyper-bin/raw/main/linux-amd64/zkvyper-linux-amd64-musl-v1.3.14',
            'Url is not correct.',
        );
    });

    it('should create sha1', function () {
        const word = 'test';
        const result = sha1(word);
        assert(result === saltFromUrl(word), 'invalid sha');
    });

    it('should get latest release', async function () {
        const latestRelease = await getLatestRelease(ZKVYPER_BIN_OWNER, ZKVYPER_BIN_REPOSITORY_NAME, USER_AGENT);
        const isGreaterThanOne = semver.gt(latestRelease, '1.0.0');
        assert.isTrue(isGreaterThanOne, `Expected latest version to be greater than 1.0.0, got ${latestRelease}`);
    });

    it('should save data to file, check content, and delete the file afterwards', async function () {
        const targetPath = path.join(process.cwd(), './xad.json');

        console.info(process.cwd());
        await saveDataToFile({ test: 'test' }, targetPath);

        const fileContent = await fse.readJson(targetPath);
        assert.deepStrictEqual(fileContent, { test: 'test' }, 'File content does not match expected JSON');

        await fse.remove(targetPath);
    });

    describe('Tests pluralize', function () {
        it('returns explicit plural when plural parameter is provided and n is not 1', function () {
            const result = pluralize(2, 'mouse', 'mice');
            expect(result === 'mice', 'Result should be mice.');
        });
    });

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

    describe('Simple compile with fallback', async function () {
        useEnvironment('simple-fallback');

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
                expect(e.message).to.include(
                    'The zkvyper compiler version (111.1.77) in the hardhat config file is not within the allowed range.',
                );
            }
        });
    });

    describe('Should not compile because of unsupported fallback option', async function () {
        useEnvironment('unsupported-fallback-optimize', 'hardhat', true);

        it('Should not compile', async function () {
            try {
                const hh = require('hardhat');
                await hh.run(TASK_COMPILE);
            } catch (e: any) {
                expect(e.message).to.include('allback_to_optimizing_for_size option in optimizer is not supported');
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

        it('should throw an error of incorrect compiler source', async function () {
            try {
                await compile({ version: 'latest', settings: {} }, [], '', '', undefined);
            } catch (e: any) {
                assert(e.message.includes('Incorrect compiler source:'));
            }
        });

        it('should throw an error of unspecified vyper executable', async function () {
            try {
                await compile({ version: 'latest', compilerSource: 'binary', settings: {} }, [], '', '', null as any);
            } catch (e: any) {
                assert(e.message.includes('vyper executable is not specified'));
            }
        });

        it('should fail the compilation because undefined is not found', async function () {
            try {
                await compile({ version: 'latest', compilerSource: 'binary', settings: {} }, [], '', '', undefined);
            } catch (e: any) {
                assert(e.message.includes('Command failed: undefined'));
            }
        });
    });

    describe('Factory with compiler version >= 1.4.0', async function () {
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
                '.__VYPER_MINIMAL_PROXY_CONTRACT:__VYPER_MINIMAL_PROXY_CONTRACT',
                factoryArtifact.factoryDeps[depHash],
                'No required dependency in the artifact',
            );

            // For the dependency contract should be no further dependencies.
            assert.deepEqual(depArtifact.factoryDeps, {}, 'Unexpected factory-deps for a dependency contract');

            // Check that the forwarder artifact was saved correctly.
            const forwarderArtifact = this.env.artifacts.readArtifactSync(
                '.__VYPER_MINIMAL_PROXY_CONTRACT:__VYPER_MINIMAL_PROXY_CONTRACT',
            ) as ZkSyncArtifact;
            assert.equal(forwarderArtifact.contractName, '__VYPER_MINIMAL_PROXY_CONTRACT');
        });
    });

    describe('Factory with compiler version < 1.4.0', async function () {
        useEnvironment('factory-with-older-compiler');

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
            const consoleSpy = sinon.spy(console, 'info');
            await this.env.run(TASK_COMPILE);

            expect(
                consoleSpy.calledWith(chalk.green('Successfully compiled 3 Solidity files and 1 Vyper file')),
            ).to.equal(true);
            consoleSpy.restore();
        });
    });
});

describe('getWindowsOutput', () => {
    it('should return the changed output for Windows path', () => {
        const output: CompilerOutput = {
            version: '0.8.0',
            '//?/C:/path/to/file.sol/contract.sol': {
                abi: [],
                metadata: '',
            },
            '//?/C:/path/to/file.sol/contract2.sol': {
                abi: [],
                metadata: '',
            },
        };

        const path_ = 'C:\\path\\to\\file.sol';

        const result = getWindowsOutput(output, path_);

        expect(result).to.be.an('object');
        expect(result).to.have.property('version');
        expect(result.version).to.equal('0.8.0');
        expect(result).to.have.property('contract.sol');
        expect(result['contract.sol']).to.deep.equal({
            abi: [],
            metadata: '',
        });
        expect(result).to.have.property('contract2.sol');
        expect(result['contract2.sol']).to.deep.equal({
            abi: [],
            metadata: '',
        });
    });

    it('should return the original output for non-Windows path', () => {
        const output: CompilerOutput = {
            version: '0.8.0',
            'path/to/file.sol/contract.sol': {
                abi: [],
                metadata: '',
            },
            'path/to/file.sol/contract2.sol': {
                abi: [],
                metadata: '',
            },
        };

        const path_ = 'path/to/file.sol';

        const result = getWindowsOutput(output, path_);

        expect(result).to.deep.equal(output);
    });

    it.skip('should call get getWindowsOutput from compiler', async () => {
        sinon.stub(compiler, 'compileWithBinary').resolves();

        const output: CompilerOutput = {
            version: '0.8.0',
            'path/to/file.sol/contract.sol': {
                abi: [],
                metadata: '',
            },
            'path/to/file.sol/contract2.sol': {
                abi: [],
                metadata: '',
            },
        };

        const getWindowsOutputStub = sinon.stub().returns(output);

        const zkvyperConfig: ZkVyperConfig = {
            compilerSource: 'binary',
            version: '1.2.3',
            settings: {
                compilerPath: '/path/to/vyper',
            },
        };

        const inputPaths = ['/path/to/input1.vy', '/path/to/input2.vy'];
        const sourcesPath = '/path/to/sources';
        const rootPath = '/path/to/root';
        const vyperPath = '/path/to/vyper';

        const result = await compile(zkvyperConfig, inputPaths, sourcesPath, rootPath, vyperPath);

        expect(result).to.be.an('object');
        expect(result).to.have.property('output');
        expect(result).to.have.property('version');
        sinon.assert.calledOnce(getWindowsOutputStub);
        sinon.restore();
    });
});
