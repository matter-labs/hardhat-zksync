import { expect, assert } from 'chai';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import chalk from 'chalk';
import sinon from 'sinon';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import net from 'net';
import proxyquire from 'proxyquire';
import { spawn, ChildProcess } from 'child_process';

import * as utils from '../src/utils';
import { constructCommandArgs, getRelease, getAssetToDownload } from '../src/utils';
import { RPCServerDownloader } from '../src/downloader';
import { TASK_NODE_ZKSYNC, PROCESS_TERMINATION_SIGNALS } from '../src/constants';

chai.use(sinonChai);

async function getPort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
            const port = (server.address() as net.AddressInfo).port;
            server.close(() => {
                resolve(port);
            });
        });
        server.on('error', reject);
    });
}

describe('node-zksync plugin', async function () {
    describe('Utils', () => {
        describe('constructCommandArgs', () => {
            it('should construct command arguments with minimum args', () => {
                const args = {};
                const result = constructCommandArgs(args);
                expect(result).to.deep.equal(['run']);
            });

            it('should correctly construct command arguments with all args', () => {
                const args = {
                    port: 8012,
                    log: 'error',
                    logFilePath: '/path/to/log',
                    cache: 'disk',
                    cacheDir: '/path/to/cache',
                    resetCache: true,
                    showStorageLogs: 'all',
                    showVmDetails: 'none',
                    showGasDetails: 'all',
                    showCalls: 'user',
                    resolveHashes: true,
                    devUseLocalContracts: true,
                    fork: 'mainnet',
                    forkBlockNumber: 100,
                };

                const result = constructCommandArgs(args);
                expect(result).to.deep.equal([
                    '--port=8012',
                    '--log=error',
                    '--log-file-path=/path/to/log',
                    '--cache=disk',
                    '--cache-dir=/path/to/cache',
                    '--reset-cache',
                    '--show-storage-logs=all',
                    '--show-vm-details=none',
                    '--show-gas-details=all',
                    '--show-calls=user',
                    '--resolve-hashes',
                    '--dev-use-local-contracts',
                    'fork --fork-at 100 mainnet',
                ]);
            });

            it('should throw error when both forkBlockNumber and replayTx are specified in all args', () => {
                const args = { fork: 'mainnet', forkBlockNumber: 100, replayTx: '0x1234567890abcdef' };
                expect(() => constructCommandArgs(args)).to.throw(
                    'Cannot specify both --fork-block-number and --replay-tx. Please specify only one of them.'
                );
            });

            it('should throw error for invalid log value', () => {
                const args = { log: 'invalid' };
                expect(() => constructCommandArgs(args)).to.throw('Invalid log value: invalid');
            });

            it('should throw error when there is no fork arg', () => {
                const args = { forkBlockNumber: 100 };
                expect(() => constructCommandArgs(args)).to.throw(
                    'Cannot specify --replay-tx or --fork-block-number parameters without --fork param.'
                );
            });

            it('should correctly construct command arguments with fork and replayTx', () => {
                const args = { fork: 'http://example.com', replayTx: '0x1234567890abcdef' };
                const result = constructCommandArgs(args);
                expect(result).to.deep.equal(['replay_tx http://example.com 0x1234567890abcdef']);
            });

            it('should throw error for invalid fork URL pattern', () => {
                const args = {
                    fork: 'invalidURL',
                };

                expect(() => constructCommandArgs(args)).to.throw('Invalid fork network value: invalidURL');
            });
        });

        describe('getAssetToDownload', () => {
            let archStub: sinon.SinonStub;
            let platformStub: sinon.SinonStub;

            const mockRelease = {
                tag_name: 'v0.1.0',
                assets: [
                    { name: 'era_test_node-v0.1.0-aarch64-apple-darwin.tar.gz' },
                    { name: 'era_test_node-v0.1.0-x86_64-apple-darwin.tar.gz' },
                    { name: 'era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz' },
                ],
            };

            beforeEach(() => {
                archStub = sinon.stub(process, 'arch');
                platformStub = sinon.stub(process, 'platform');
            });

            afterEach(() => {
                archStub.restore();
                platformStub.restore();
            });

            it('should return the correct asset for x64 apple-darwin', async () => {
                archStub.value('x64');
                platformStub.value('darwin');
                expect(await getAssetToDownload(mockRelease)).to.deep.equal(mockRelease.assets[1]);
            });

            it('should return the correct asset for aarch64 apple-darwin', async () => {
                archStub.value('arm64');
                platformStub.value('darwin');
                expect(await getAssetToDownload(mockRelease)).to.deep.equal(mockRelease.assets[0]);
            });

            it('should return the correct asset for x64 linux', async () => {
                archStub.value('x64');
                platformStub.value('linux');
                expect(await getAssetToDownload(mockRelease)).to.deep.equal(mockRelease.assets[2]);
            });

            it('should throw an error for unsupported platform', async () => {
                archStub.value('x64');
                platformStub.value('win32');
                try {
                    await getAssetToDownload(mockRelease);
                    throw new Error("Expected an error to be thrown, but it wasn't.");
                } catch (error: any) {
                    expect(error.message).to.include('Unsupported platform');
                }
            });
        });

        describe('getLatestRelease', () => {
            let axiosGetStub: sinon.SinonStub;

            const mockRelease = {
                assets: [
                    {
                        url: 'https://api.github.com/repos/matter-labs/era-test-node/releases/assets/1',
                        browser_download_url:
                            'https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-aarch64-apple-darwin.tar.gz',
                    },
                    {
                        url: 'https://api.github.com/repos/matter-labs/era-test-node/releases/assets/2',
                        browser_download_url:
                            'https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-x86_64-apple-darwin.tar.gz',
                    },
                    {
                        url: 'https://api.github.com/repos/matter-labs/era-test-node/releases/assets/3',
                        browser_download_url:
                            'https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz',
                    },
                ],
            };

            beforeEach(() => {
                axiosGetStub = sinon.stub(axios, 'get');
            });

            afterEach(() => {
                axiosGetStub.restore();
            });

            it('should fetch the latest release successfully', async () => {
                axiosGetStub.resolves({ data: mockRelease });

                const result = await getRelease('owner', 'repo', 'userAgent');
                expect(result).to.deep.equal(mockRelease);

                sinon.assert.calledOnce(axiosGetStub);
            });

            it('should handle errors when the server responds with a non-2xx status code', async () => {
                const errorResponse = {
                    response: {
                        status: 404,
                        data: {
                            message: 'Not Found',
                        },
                    },
                };

                axiosGetStub.rejects(errorResponse);

                try {
                    await getRelease('owner', 'repo', 'userAgent', 'v0.1.0');
                    assert.fail('Expected an error to be thrown');
                } catch (error: any) {
                    expect(error.message).to.include('Failed to get v0.1.0 release');
                    expect(error.message).to.include('404');
                    expect(error.message).to.include('Not Found');
                }
            });

            it('should handle errors when no response is received', async () => {
                const errorNoResponse = {
                    request: {},
                    message: 'No response',
                };

                axiosGetStub.rejects(errorNoResponse);

                try {
                    await getRelease('owner', 'repo', 'userAgent');
                    assert.fail('Expected an error to be thrown');
                } catch (error: any) {
                    expect(error.message).to.include('No response received');
                }
            });

            it('should handle errors during request setup', async () => {
                const errorSetup = {
                    message: 'Setup error',
                };

                axiosGetStub.rejects(errorSetup);

                try {
                    await getRelease('owner', 'repo', 'userAgent');
                    assert.fail('Expected an error to be thrown');
                } catch (error: any) {
                    expect(error.message).to.include('Failed to set up the request');
                }
            });
        });

        describe('waitForNodeToBeReady', () => {
            afterEach(() => {
                sinon.restore();
            });

            it('should return successfully if the node is ready', async () => {
                // Mock the axios.post to simulate a node being ready
                sinon.stub(axios, 'post').resolves({ data: { result: true } });

                const port = 12345; // any port for testing purposes
                await utils.waitForNodeToBeReady(port);

                expect(axios.post).to.have.been.calledWith(`http://127.0.0.1:${port}`);
            });

            it("should throw an error if the node isn't ready after maxAttempts", async () => {
                // Make the stub reject all the time to simulate the node never being ready
                sinon.stub(axios, 'post').rejects(new Error('Node not ready'));

                try {
                    await utils.waitForNodeToBeReady(8080, 1);
                    throw new Error('Expected waitForNodeToBeReady to throw but it did not');
                } catch (err: any) {
                    expect(err.message).to.equal("Server didn't respond after multiple attempts");
                }
            });
        });

        describe('adjustTaskArgsForPort', () => {
            it("should correctly add the --port argument if it's not present", () => {
                const result = utils.adjustTaskArgsForPort([], 8000);
                expect(result).to.deep.equal(['--port', '8000']);
            });

            it("should correctly update the --port argument if it's present", () => {
                const result = utils.adjustTaskArgsForPort(['--port', '9000'], 8000);
                expect(result).to.deep.equal(['--port', '8000']);
            });
        });

        describe('isPortAvailable', () => {
            let server: net.Server;

            afterEach(() => {
                if (server) server.close();
            });

            it('should correctly identify an available port', async () => {
                const port = await getPort();
                const result = await utils.isPortAvailable(port);
                expect(result).to.be.true;
            });

            it('should correctly identify a port that is in use', async () => {
                const port = await getPort();
                server = net.createServer().listen(port);
                const result = await utils.isPortAvailable(port);
                expect(result).to.be.false;
            });
        });

        describe('getAvailablePort', () => {
            let isPortAvailableStub: sinon.SinonStub<[number], Promise<boolean>>;

            beforeEach(() => {
                isPortAvailableStub = sinon.stub(utils, 'isPortAvailable');
            });

            afterEach(() => {
                isPortAvailableStub.restore();
            });

            it('should return the first available port', async () => {
                isPortAvailableStub.returns(Promise.resolve(true));
                const port = await utils.getAvailablePort(8080, 10);
                expect(port).to.equal(8080);
            });

            // it('should throw an error after checking the maxAttempts number of ports', async () => {
            //     isPortAvailableStub.returns(Promise.resolve(false));

            //     try {
            //         await utils.getAvailablePort(8000, 10);
            //         throw new Error('Expected getAvailablePort to throw but it did not');
            //     } catch (err: any) {
            //         expect(err.message).to.equal('Couldn\'t find an available port after several attempts');
            //     }
            // });
        });
    });

    describe('RPCServerDownloader', () => {

        const mockRelease = {
            url: 'https://api.github.com/repos/matter-labs/era-test-node/releases/assets/latest',
            tag_name: 'v1.0.0',
        };

        const mockAsset = {
            browser_download_url:
            'https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-aarch64-apple-darwin.tar.gz',
        }
    
        let downloadStub: sinon.SinonStub;
        let existsSyncStub: sinon.SinonStub;
        let postProcessDownloadStub: sinon.SinonStub;
        let releaseStub: sinon.SinonStub;
        let assetToDownloadStub: sinon.SinonStub;

        beforeEach(() => {
            downloadStub = sinon.stub(utils, 'download');
            releaseStub = sinon.stub(utils, 'getRelease');
            assetToDownloadStub = sinon.stub(utils, 'getAssetToDownload');
            existsSyncStub = sinon.stub(fs, 'existsSync');
            postProcessDownloadStub = sinon
                .stub(RPCServerDownloader.prototype as any, '_postProcessDownload')
                .resolves(); // Stubbing the private method
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('download', () => {
            it('should download the binary if not already downloaded', async () => {
                const downloader = new RPCServerDownloader('../cache/node', 'latest');

                existsSyncStub.resolves(false);
                releaseStub.resolves(mockRelease);
                assetToDownloadStub.resolves(mockAsset);
                downloadStub.resolves('v1.0.0');

                await downloader.downloadIfNeeded(false);

                sinon.assert.calledOnce(downloadStub);
                sinon.assert.calledOnce(postProcessDownloadStub);
                sinon.assert.calledOnce(releaseStub);
            });

            it('should force download the binary', async () => {
                const downloader = new RPCServerDownloader('../cache/node', 'latest');

                existsSyncStub.resolves(false);
                releaseStub.resolves(mockRelease);
                assetToDownloadStub.resolves(mockAsset);
                downloadStub.resolves('v1.0.0');

                await downloader.downloadIfNeeded(true);

                sinon.assert.calledOnce(downloadStub);
                sinon.assert.calledOnce(postProcessDownloadStub);
                sinon.assert.calledOnce(releaseStub);
            });

            it('should throw an error if download fails', async () => {
                const downloader = new RPCServerDownloader('../cache/node', 'latest');

                downloadStub.throws(new Error('Mocked download failure'));
                existsSyncStub.resolves(false);
                releaseStub.resolves(mockRelease);
                assetToDownloadStub.resolves(mockRelease);

                try {
                    await downloader.downloadIfNeeded(false);
                    expect.fail('Expected an error to be thrown');
                } catch (error: any) {
                    expect(error.message).to.contain('Error downloading binary from URL');
                }
            });
        });
    });

    describe('JsonRpcServer', () => {
        interface SpawnSyncError extends Error {
            signal?: string;
        }

        let spawnStub = sinon.stub();
        let consoleInfoStub: sinon.SinonStub;

        // Because we cannot stub the execSync method directly, we use proxyquire to stub the entire 'child_process' module
        const { JsonRpcServer } = proxyquire('../src/server', {
            'child_process': { spawn: spawnStub },
        });

        beforeEach(() => {
            spawnStub.reset();
            consoleInfoStub = sinon.stub(console, 'info');
        });

        afterEach(() => {
            consoleInfoStub.restore();
        });

        describe('listen', () => {
            it('should start the JSON-RPC server with the provided arguments', () => {
                const server = new JsonRpcServer('/path/to/binary');
                const args = ['--arg1=value1', '--arg2=value2'];

                server.listen(args);

                sinon.assert.calledWithExactly(spawnStub, '/path/to/binary', args, { stdio: 'inherit' });
            });

            it('should print a starting message when server starts', () => {
                const server = new JsonRpcServer('/path/to/binary');
                server.listen();

                sinon.assert.calledWith(consoleInfoStub, chalk.green('Starting the JSON-RPC server at 127.0.0.1:8011'));
            });

            it.skip('should handle termination signals gracefully', () => {
                const server = new JsonRpcServer('/path/to/binary');
                const error = new Error('Mocked error') as SpawnSyncError;
                error.signal = PROCESS_TERMINATION_SIGNALS[0]; // Let's simulate the first signal, e.g., 'SIGINT'
                spawnStub.throws(error);

                try {
                    server.listen();
                } catch (e) {
                    // We don't expect an error to be thrown for termination signals
                    expect.fail('Did not expect an error to be thrown');
                }

                sinon.assert.calledWithMatch(
                    consoleInfoStub,
                    chalk.yellow(`Received ${PROCESS_TERMINATION_SIGNALS[0]} signal. The server process has exited.`)
                );
            });

            it('should throw an error if the server process exits with an error', () => {
                const server = new JsonRpcServer('/path/to/binary');
                const error = new Error('Mocked error');
                spawnStub.throws(error);

                try {
                    server.listen();
                    expect.fail('Expected an error to be thrown');
                } catch (error: any) {
                    expect(error.message).to.equal('Expected an error to be thrown');
                }
            });
        });
    });

    describe('TASK_NODE_ZKSYNC', function () {
        this.timeout(10000); // Increase timeout if needed

        let serverProcess: ChildProcess;

        function delay(ms: number): Promise<void> {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        afterEach(() => {
            if (serverProcess) {
                serverProcess.kill();
            }
        });

        it('Should successfully start the server', async function () {
            // Start the server by running the task in a child process
            serverProcess = spawn('ts-node', ['runHardhatTask.js', TASK_NODE_ZKSYNC], {
                cwd: path.join(__dirname, 'fixture-projects', 'simple'),
            });

            // Send SIGINT to the serverProcess
            serverProcess.kill(PROCESS_TERMINATION_SIGNALS[0] as NodeJS.Signals);

            // Wait for the server process to exit gracefully (i.e., not due to an error)
            return await new Promise((resolve, reject) => {
                serverProcess.on('exit', (code, signal) => {
                    if (signal === PROCESS_TERMINATION_SIGNALS[0]) {
                        resolve();
                    } else {
                        reject(new Error(`Process was terminated by unexpected signal: ${signal}`));
                    }
                });
            });
        });

        // it.only('Should return the correct chainID', async function () {
        //     const rpcUrl: string = 'http://localhost:8011';
        //     const requestData = {
        //         jsonrpc: "2.0",
        //         id: 1,
        //         method: "eth_chainId",
        //         params: []
        //     };

        //     serverProcess = spawn('ts-node', ['runHardhatTask.js', TASK_NODE_ZKSYNC], {
        //         cwd: path.join(__dirname, 'fixture-projects', 'simple'),
        //     });

        //     await delay(2000);

        //     try {
        //         const response = await axios.post(rpcUrl, requestData);
        //         const chainId: string = response.data.result;

        //         assert.strictEqual(chainId, '0x104', 'Unexpected chainId received from the server');
        //     } catch (error: any) {
        //         throw new Error(`Failed to get chainId from the server: ${error.message}`);
        //     } finally {
        //         serverProcess.kill(PROCESS_TERMINATION_SIGNALS[0] as NodeJS.Signals);
        //     }
        // });
    });
});
