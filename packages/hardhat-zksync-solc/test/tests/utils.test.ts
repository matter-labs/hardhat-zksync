import { expect } from 'chai';
import sinon from 'sinon';
import { SolcConfig } from 'hardhat/types';
import fs from 'fs';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { CompilerOutputSelection, ZkSolcConfig } from '../../src/types';
import {
    filterSupportedOutputSelections,
    updateCompilerConf,
    getVersionComponents,
    writeLibrariesToFile,
    download,
    getLatestRelease,
    saveDataToFile,
    getZksolcUrl,
    pluralize,
    sha1,
} from '../../src/utils';

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
        it('should update compiler configuration with zksolc settings', () => {
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
                version: '1.3.17',
                settings: {
                    optimizer: {
                        enabled: false,
                        runs: 150,
                    },
                    metadata: {},
                },
            };

            updateCompilerConf(compiler, zksolc);

            expect(compiler.settings.optimizer).to.deep.equal(zksolc.settings.optimizer);
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

            expect(fs.existsSync(path)).to.be.true;

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
            const version = '1.0.0';

            const mockPool = mockAgent.get('https://example.com/');

            mockPool
                .intercept({
                    path: '/',
                    method: 'GET',
                    headers: {},
                    body: JSON.stringify({
                        'User-Agent': `${userAgent} ${version}`,
                    }),
                })
                .reply(200, {
                    message: 'all good',
                });

            await download(url, filePath, userAgent, version);

            expect(fs.existsSync(filePath)).is.true;

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

            const release = await getLatestRelease(owner, repo, userAgent);

            expect(release).to.deep.equal('1.0.0');
        });
    });

    describe('saveDataToFile', () => {
        it('should save data to a file', async () => {
            const testData = { name: 'Test Data' };
            const path = './test/libraries.json';

            await saveDataToFile(testData, path);

            expect(fs.existsSync(path)).to.be.true;

            fs.rmSync(path);
        });
    });
});

describe('getZksolcUrl', () => {
    const platformStub = sinon.stub(process, 'platform');

    it('should return the release URL when isRelease is true', () => {
        platformStub.value('linux'); // Mock the process.platform property
        const repo = 'example/repo';
        const version = '1.0.0';
        let expectedUrl = 'example/repo/releases/download/v1.0.0/zksolc-linux-amd64-musl-v1.0.0';

        const url = getZksolcUrl(repo, version, true);

        expect(url).to.equal(expectedUrl);

        platformStub.value('darwin'); // Mock the process.platform property
        expectedUrl = 'example/repo/releases/download/v1.0.0/zksolc-macosx-amd64-v1.0.0';

        const urlMac = getZksolcUrl(repo, version, true);

        expect(urlMac).to.equal(expectedUrl);
    });

    it('should return the raw URL when isRelease is false', () => {
        platformStub.value('linux'); // Mock the process.platform property
        const repo = 'example/repo';
        const version = '1.0.0';
        let expectedUrl = 'example/repo/raw/main/linux-amd64/zksolc-linux-amd64-musl-v1.0.0';

        const url = getZksolcUrl(repo, version, false);

        expect(url).to.equal(expectedUrl);

        platformStub.value('darwin'); // Mock the process.platform property
        expectedUrl = 'example/repo/raw/main/macosx-amd64/zksolc-macosx-amd64-v1.0.0';

        const urlMac = getZksolcUrl(repo, version, false);

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
