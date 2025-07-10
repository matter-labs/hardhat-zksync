import { expect } from 'chai';
import sinon from 'sinon';
import { SolcConfig } from 'hardhat/types';
import fs from 'fs';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { CompilerOutputSelection, ZkSolcConfig } from '../../src/types';
import {
    filterSupportedOutputSelections,
    updateDefaultCompilerConfig,
    getVersionComponents,
    writeLibrariesToFile,
    download,
    getLatestRelease,
    saveDataToFile,
    getZksolcUrl,
    pluralize,
    sha1,
    updateBreakableCompilerConfig,
} from '../../src/utils';
import { fallbackLatestZkSolcVersion } from '../../src/constants';

describe('Utils', () => {
    describe('filterSupportedOutputSelections', () => {
        it('should filter unsupported output selections based on zkCompilerVersion', () => {
            const outputSelection = {
                'file1.sol': {
                    Contract1: ['abi', 'evm.bytecode'],
                },
                'file2.sol': {
                    Contract2: ['abi', 'evm.bytecode', 'metadata'],
                },
            };
            const zkCompilerVersion = '1.3.7';

            const filteredOutputSelection = filterSupportedOutputSelections(outputSelection, zkCompilerVersion);

            expect(filteredOutputSelection).to.deep.equal({
                'file1.sol': {
                    Contract1: ['abi'],
                },
                'file2.sol': {
                    Contract2: ['abi', 'metadata'],
                },
            });
        });
    });

    describe('updateCompilerConf', () => {
        it('should update compiler configuration with default zksolc settings', () => {
            const outputSelection: CompilerOutputSelection = {
                'file1.sol': {
                    Contract1: ['abi', 'evm.bytecode'],
                },
                'file2.sol': {
                    Contract2: ['abi', 'evm.bytecode', 'metadata'],
                },
            };

            const compiler: SolcConfig = {
                version: '0.8.17',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    outputSelection,
                    metadata: {},
                },
            };
            const zksolc: ZkSolcConfig = {
                version: 'latest',
                settings: {
                    optimizer: {
                        enabled: false,
                        runs: 150,
                    },
                    metadata: {},
                },
            };

            updateDefaultCompilerConfig({ compiler }, zksolc);

            expect(compiler.settings.optimizer).to.deep.equal(zksolc.settings.optimizer);
        });

        it('should update compiler configuration with zksolc settings and with forceEvmla', () => {
            const outputSelection: CompilerOutputSelection = {
                'file1.sol': {
                    Contract1: ['abi', 'evm.bytecode'],
                },
                'file2.sol': {
                    Contract2: ['abi', 'evm.bytecode', 'metadata'],
                },
            };

            const compiler: SolcConfig = {
                version: '0.8.17',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    outputSelection,
                    metadata: {},
                },
            };
            const zksolc: ZkSolcConfig = {
                version: '1.5.0',
                settings: {
                    enableEraVMExtensions: true,
                    optimizer: {
                        enabled: false,
                        runs: 150,
                    },
                    metadata: {},
                },
            };

            updateDefaultCompilerConfig({ compiler }, zksolc);
            updateBreakableCompilerConfig({ compiler }, zksolc, '1.0.1', [{ version: '0.8.17' }]);

            expect(compiler.settings.optimizer).to.deep.equal(zksolc.settings.optimizer);
            expect(compiler.eraVersion).to.equal('1.0.1');
            expect(compiler.settings.viaEVMAssembly).to.equal(undefined);
            expect(compiler.settings.enableEraVMExtensions).to.deep.equal(true);
        });

        it('should not update compiler configuration with zksolc settings and with forceEvmla for zksolc < 1.5.0', () => {
            const outputSelection: CompilerOutputSelection = {
                'file1.sol': {
                    Contract1: ['abi', 'evm.bytecode'],
                },
                'file2.sol': {
                    Contract2: ['abi', 'evm.bytecode', 'metadata'],
                },
            };

            const compiler: SolcConfig = {
                version: '0.8.17',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    outputSelection,
                    metadata: {},
                },
            };
            const zksolc: ZkSolcConfig = {
                version: '1.4.1',
                settings: {
                    enableEraVMExtensions: true,
                    optimizer: {
                        enabled: false,
                        runs: 150,
                    },
                    metadata: {},
                },
            };

            updateDefaultCompilerConfig({ compiler }, zksolc);
            updateBreakableCompilerConfig({ compiler }, zksolc, '1.0.0', [{ version: '0.8.17', eraVersion: '1.0.0' }]);

            expect(compiler.settings.optimizer).to.deep.equal(zksolc.settings.optimizer);
            expect(compiler.settings.forceEVMLA).to.equal(undefined);
            expect(compiler.settings.enableEraVMExtensions).to.deep.equal(undefined);
            expect(compiler.eraVersion).to.equal('1.0.0');
        });

        it('should update compiler configuration with zksolc and with zkvm solc', () => {
            const outputSelection: CompilerOutputSelection = {
                'file1.sol': {
                    Contract1: ['abi', 'evm.bytecode'],
                },
                'file2.sol': {
                    Contract2: ['abi', 'evm.bytecode', 'metadata'],
                },
            };

            const compiler: SolcConfig = {
                version: '0.8.17',
                eraVersion: 'latest',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    outputSelection,
                    metadata: {},
                },
            };
            const zksolc: ZkSolcConfig = {
                version: '1.5.1',
                settings: {
                    enableEraVMExtensions: true,
                    forceEVMLA: true,
                    optimizer: {
                        enabled: false,
                        runs: 150,
                    },
                    metadata: {},
                },
            };

            updateDefaultCompilerConfig({ compiler }, zksolc);
            updateBreakableCompilerConfig({ compiler }, zksolc, '1.0.1', [{ version: '0.8.17', eraVersion: '1.0.0' }]);

            expect(compiler.settings.optimizer).to.deep.equal(zksolc.settings.optimizer);
            expect(compiler.settings.forceEVMLA).to.equal(true);
            expect(compiler.settings.enableEraVMExtensions).to.equal(true);
            expect(compiler.eraVersion).to.equal('1.0.0');
        });

        it('should not update compiler configuration with zksolc and with zkvm solc', () => {
            const outputSelection: CompilerOutputSelection = {
                'file1.sol': {
                    Contract1: ['abi', 'evm.bytecode'],
                },
                'file2.sol': {
                    Contract2: ['abi', 'evm.bytecode', 'metadata'],
                },
            };

            const compiler: SolcConfig = {
                version: '0.8.17',
                eraVersion: 'latest',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    outputSelection,
                    metadata: {},
                },
            };
            const zksolc: ZkSolcConfig = {
                version: '1.3.21',
                settings: {
                    optimizer: {
                        enabled: false,
                        runs: 150,
                    },
                    metadata: {},
                },
            };

            try {
                updateBreakableCompilerConfig({ compiler }, zksolc, '1.0.0', [
                    { version: '0.8.17', eraVersion: 'latest' },
                ]);
            } catch (e: any) {
                expect(e.message).to.equal(
                    'zkVm (eraVersion) compiler is supported only with usage of zksolc version >= 1.3.22.',
                );
            }
        });
    });

    describe('getVersionComponents', () => {
        it('should return an array of version components', () => {
            const version = '0.7.2';

            const versionComponents = getVersionComponents(version);

            expect(versionComponents).to.deep.equal([0, 7, 2]);
        });
    });

    describe('writeLibrariesToFile', () => {
        it('should write libraries to file', async () => {
            const path = './test/libraries.json';
            const libraries = [
                { name: 'Library1', address: '0x1234567890' },
                { name: 'Library2', address: '0xabcdef1234' },
            ];

            await writeLibrariesToFile(path, libraries);

            expect(fs.existsSync(path)).to.equal(true);

            fs.rmSync(path);
        });
    });

    describe('download', () => {
        const mockAgent = new MockAgent();
        setGlobalDispatcher(mockAgent);

        it('should download a file from a URL', async () => {
            const url = 'https://example.com/';
            const filePath = './file.txt';
            const userAgent = 'Test User Agent';

            const mockPool = mockAgent.get('https://example.com/');

            mockPool
                .intercept({
                    path: '/',
                    method: 'GET',
                    headers: {},
                    body: JSON.stringify({
                        'User-Agent': `${userAgent}`,
                    }),
                })
                .reply(200, {
                    message: 'all good',
                });

            await download(url, filePath, userAgent);

            expect(fs.existsSync(filePath)).to.equal(true);

            fs.rmSync(filePath);
        });
    });

    describe('getRelease', () => {
        const mockAgent = new MockAgent();
        setGlobalDispatcher(mockAgent);

        it('should get release information from GitHub', async () => {
            const owner = 'example';
            const repo = 'project';
            const userAgent = 'Test User Agent';
            const tag = 'v1.0.0';

            const mockPool = mockAgent.get('https://github.com');

            mockPool
                .intercept({
                    path: `/${owner}/${repo}/releases/latest`,
                    method: 'GET',
                    headers: {
                        'User-Agent': `${userAgent}`,
                    },
                })
                .reply(
                    302,
                    {},
                    {
                        headers: {
                            location: `https://github.com/${owner}/${repo}/releases/tag/${tag}`,
                        },
                    },
                );

            const release = await getLatestRelease(owner, repo, userAgent, fallbackLatestZkSolcVersion);

            expect(release).to.deep.equal('1.0.0');
        });
    });

    describe('saveDataToFile', () => {
        it('should save data to a file', async () => {
            const testData = { name: 'Test Data' };
            const path = './test/libraries.json';

            await saveDataToFile(testData, path);

            expect(fs.existsSync(path)).to.equal(true);

            fs.rmSync(path);
        });
    });
});

describe('getZksolcUrl', () => {
    const platformStub = sinon.stub(process, 'platform');

    it('should return the release URL', () => {
        platformStub.value('linux'); // Mock the process.platform property
        const archStub = sinon.stub(process, 'arch');
        archStub.value('x64');
        const repo = 'example/repo';
        const version = '1.0.0';
        let expectedUrl = 'example/repo/releases/download/1.0.0/zksolc-linux-amd64-musl-v1.0.0';

        const url = getZksolcUrl(repo, version);

        expect(url).to.equal(expectedUrl);

        platformStub.value('darwin'); // Mock the process.platform property
        expectedUrl = 'example/repo/releases/download/1.0.0/zksolc-macosx-amd64-v1.0.0';

        const urlMac = getZksolcUrl(repo, version);

        expect(urlMac).to.equal(expectedUrl);
    });
});
describe('pluralize', () => {
    it('should return singular when n is 1', () => {
        const result = pluralize(1, 'apple', 'apples');
        expect(result).to.equal('apple');
    });

    it('should return plural when n is not 1 and plural is provided', () => {
        const result = pluralize(3, 'apple', 'apples');
        expect(result).to.equal('apples');
    });

    it('should return singular with "s" appended when n is not 1 and plural is not provided', () => {
        const result = pluralize(3, 'apple');
        expect(result).to.equal('apples');
    });

    describe('sha1', () => {
        it('should return the SHA1 hash of a string', () => {
            const str = 'Hello, World!';
            const expectedHash = '0a0a9f2a6772942557ab5355d76af442f8f65e01';

            const hash = sha1(str);

            expect(hash).to.equal(expectedHash);
        });
    });
});
