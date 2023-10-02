import { expect, assert } from 'chai';
import chalk from 'chalk';
import sinon from 'sinon';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import proxyquire from 'proxyquire';
import { spawn, ChildProcess } from "child_process";

import * as utils from '../src/utils';
import { constructCommandArgs, getLatestRelease, getAssetToDownload, download } from '../src/utils';
import { RPCServerDownloader } from '../src/downloader';
import { TASK_NODE_ZKSYNC, PROCESS_TERMINATION_SIGNALS } from '../src/constants';

describe('node-zksync plugin', async function () {
    describe('Utils', () => {
        describe('constructCommandArgs', () => {
            it('should correctly construct command arguments', () => {
                const args = {
                    log: 'error',
                    logFilePath: '/path/to/log',
                    cache: 'disk',
                    cacheDir: '/path/to/cache',
                    resetCache: true,
                    fork: 'mainnet',
                    showStorageLogs: 'all',
                    showVmDetails: 'none',
                    showGasDetails: 'all',
                    showCalls: true,
                    resolveHashes: true
                };

                const result = constructCommandArgs(args);
                expect(result).to.deep.equal([
                    '--log=error',
                    '--log-file-path=/path/to/log',
                    '--cache=disk',
                    '--cache-dir=/path/to/cache',
                    '--reset-cache',
                    '--fork=mainnet',
                    '--show-storage-logs=all',
                    '--show-vm-details=none',
                    '--show-gas-details=all',
                    '--show-calls',
                    '--resolve-hashes',
                    'run'
                ]);
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
                    { name: 'era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz' }
                ]
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
                    expect(error.message).to.include("Unsupported platform");
                }
            });
        });

        describe('getLatestRelease', () => {
            let axiosGetStub: sinon.SinonStub;

            const mockRelease = {
                assets: [
                    {
                        url: "https://api.github.com/repos/matter-labs/era-test-node/releases/assets/1",
                        browser_download_url: "https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-aarch64-apple-darwin.tar.gz",
                    },
                    {
                        url: "https://api.github.com/repos/matter-labs/era-test-node/releases/assets/2",
                        browser_download_url: "https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-x86_64-apple-darwin.tar.gz",
                    },
                    {
                        url: "https://api.github.com/repos/matter-labs/era-test-node/releases/assets/3",
                        browser_download_url: "https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz",
                    }
                ]
            };

            beforeEach(() => {
                axiosGetStub = sinon.stub(axios, 'get');
            });

            afterEach(() => {
                axiosGetStub.restore();
            });

            it('should fetch the latest release successfully', async () => {
                axiosGetStub.resolves({ data: mockRelease });

                const result = await getLatestRelease('owner', 'repo', 'userAgent');
                expect(result).to.deep.equal(mockRelease);

                sinon.assert.calledOnce(axiosGetStub);
            });

            it('should handle errors when the server responds with a non-2xx status code', async () => {
                const errorResponse = {
                    response: {
                        status: 404,
                        data: {
                            message: "Not Found"
                        }
                    }
                };

                axiosGetStub.rejects(errorResponse);

                try {
                    await getLatestRelease('owner', 'repo', 'userAgent');
                    assert.fail("Expected an error to be thrown");
                } catch (error: any) {
                    expect(error.message).to.include("Failed to get latest release");
                    expect(error.message).to.include("404");
                    expect(error.message).to.include("Not Found");
                }
            });

            it('should handle errors when no response is received', async () => {
                const errorNoResponse = {
                    request: {},
                    message: "No response"
                };

                axiosGetStub.rejects(errorNoResponse);

                try {
                    await getLatestRelease('owner', 'repo', 'userAgent');
                    assert.fail("Expected an error to be thrown");
                } catch (error: any) {
                    expect(error.message).to.include("No response received");
                }
            });

            it('should handle errors during request setup', async () => {
                const errorSetup = {
                    message: "Setup error"
                };

                axiosGetStub.rejects(errorSetup);

                try {
                    await getLatestRelease('owner', 'repo', 'userAgent');
                    assert.fail("Expected an error to be thrown");
                } catch (error: any) {
                    expect(error.message).to.include("Failed to set up the request");
                }
            });
        });
    });

    describe('RPCServerDownloader', () => {
        let downloadStub: sinon.SinonStub;
        let existsSyncStub: sinon.SinonStub;
        let postProcessDownloadStub: sinon.SinonStub;

        beforeEach(() => {
            downloadStub = sinon.stub(utils, 'download');
            existsSyncStub = sinon.stub(fs, 'existsSync');
            postProcessDownloadStub = sinon.stub(RPCServerDownloader.prototype as any, '_postProcessDownload').resolves();  // Stubbing the private method
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('isDownloaded', () => {

            it('should return true if binary exists', async () => {
                const downloader = new RPCServerDownloader('/path/to/dir', 'version');
                existsSyncStub.returns(true);

                const result = await downloader.isDownloaded();
                expect(result).to.be.true;
            });

            it('should return false if binary does not exist', async () => {
                const downloader = new RPCServerDownloader('/path/to/dir', 'version');
                existsSyncStub.returns(false);

                const result = await downloader.isDownloaded();
                expect(result).to.be.false;
            });

        });

        describe('download', () => {

            it('should download the binary if not already downloaded', async () => {
                const downloader = new RPCServerDownloader('/path/to/dir', 'version');
                existsSyncStub.returns(false);

                await downloader.download('http://example.com/binary');

                sinon.assert.calledOnce(downloadStub);
            });

            it('should throw an error if download fails', async () => {
                const downloader = new RPCServerDownloader('/path/to/dir', 'version');
                downloadStub.throws(new Error('Mocked download failure'));

                try {
                    await downloader.download('http://example.com/binary');
                    expect.fail('Expected an error to be thrown');
                } catch (error: any) {
                    expect(error.message).to.contain('Error downloading binary from URL');
                }
            });

        });

        describe('getBinaryPath', () => {
            it('should return the correct binary path', () => {
                const downloader = new RPCServerDownloader('/path/to/dir', 'version');

                const result = downloader.getBinaryPath();
                expect(result).to.equal('/path/to/dir/version');
            });
        });

    });

    describe('JsonRpcServer', () => {
        interface ExecSyncError extends Error {
            signal?: string;
        }

        const execSyncStub = sinon.stub();
        let consoleInfoStub: sinon.SinonStub;

        // Because we cannot stub the execSync method directly, we use proxyquire to stub the entire 'child_process' module
        const { JsonRpcServer } = proxyquire('../src/server', {
            'child_process': { execSync: execSyncStub }
        });

        beforeEach(() => {
            execSyncStub.reset();
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

                sinon.assert.calledWith(execSyncStub, '/path/to/binary --arg1=value1 --arg2=value2');
            });

            it('should print a starting message when server starts', () => {
                const server = new JsonRpcServer('/path/to/binary');
                server.listen();

                sinon.assert.calledWith(consoleInfoStub, chalk.green('Starting the JSON-RPC server with command: /path/to/binary '));
            });

            it('should handle termination signals gracefully', () => {
                const server = new JsonRpcServer('/path/to/binary');
                const error = new Error('Mocked error') as ExecSyncError;
                error.signal = PROCESS_TERMINATION_SIGNALS[0];  // Let's simulate the first signal, e.g., 'SIGINT'
                execSyncStub.throws(error);

                try {
                    server.listen();
                } catch (e) {
                    // We don't expect an error to be thrown for termination signals
                    expect.fail('Did not expect an error to be thrown');
                }

                sinon.assert.calledWith(consoleInfoStub, chalk.yellow(`Received ${PROCESS_TERMINATION_SIGNALS[0]} signal. The server process has exited.`));
            });

            it('should throw an error if the server process exits with an error', () => {
                const server = new JsonRpcServer('/path/to/binary');
                const error = new Error('Mocked error');
                execSyncStub.throws(error);

                try {
                    server.listen();
                    expect.fail('Expected an error to be thrown');
                } catch (error: any) {
                    expect(error.message).to.equal('The server process has exited with an error: Mocked error');
                }
            });
        });
    });

    describe('Testing task', function () {
        this.timeout(10000); // Increase timeout if needed

        let serverProcess: ChildProcess;

        function delay(ms: number): Promise<void> {
            return new Promise(resolve => setTimeout(resolve, ms));
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
