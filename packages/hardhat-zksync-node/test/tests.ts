import chai, { expect, assert } from 'chai';
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
import { constructCommandArgs } from '../src/utils';
import { RPCServerDownloader } from '../src/downloader';
import { TASK_NODE_ZKSYNC, PROCESS_TERMINATION_SIGNALS } from '../src/constants';
import { USER_AGENT } from '../dist/constants';

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
    describe('getLatestRelease', async function () {
        let mockPool: any;
        before(() => {
            const { MockAgent, setGlobalDispatcher } = require('undici');
            const mockAgent = new MockAgent();
            mockPool = mockAgent.get('https://github.com');

            setGlobalDispatcher(mockAgent);
        });

        const mockRelease = '0.1.0';

        it('should fetch the latest release successfully', async function () {
            mockPool
                .intercept({
                    path: '/owner/repo/releases/latest',
                    timeout: 30000,
                    'User-Agent': USER_AGENT,
                    method: 'GET',
                })
                .reply(
                    302,
                    {},
                    {
                        headers: {
                            location: 'https://github.com/owner/repo/releases/tag/v0.1.0',
                        },
                    },
                );

            const result = await utils.getLatestRelease('owner', 'repo', 'userAgent', 30000);
            expect(result).to.deep.equal(mockRelease);
        });

        it('should handle errors when the server responds with a non-2xx status code', async function () {
            mockPool
                .intercept({
                    path: '/owner/repo/releases/latest',
                    method: 'GET',
                })
                .reply(404, {
                    body: {
                        status: 404,
                        data: {
                            message: 'Not Found',
                        },
                    },
                });

            try {
                await utils.getLatestRelease('owner', 'repo', 'userAgent', 30000);
                assert.fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.be.equal(
                    'Unexpected response status: 404 for URL: https://github.com/owner/repo/releases/latest',
                );
            }
        });

        it('should handle errors when no response is received', async function () {
            mockPool
                .intercept({
                    path: '/owner/repo/releases/latest',
                    timeout: 30000,
                    'User-Agent': USER_AGENT,
                    method: 'GET',
                })
                .reply(
                    302,
                    {},
                    {
                        headers: {},
                    },
                );

            try {
                await utils.getLatestRelease('owner', 'repo', 'userAgent', 30000);
                assert.fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.be.equal(
                    'Redirect location not found for URL: https://github.com/owner/repo/releases/latest',
                );
            }
        });

        it('should handle errors during request setup', async function () {
            mockPool
                .intercept({
                    path: '/owner/repo/releases/latest',
                    timeout: 30000,
                    'User-Agent': USER_AGENT,
                    method: 'GET',
                })
                .reply(
                    302,
                    {},
                    {
                        headers: {
                            location: 'https://github.com/owner/wrong/',
                        },
                    },
                );

            try {
                await utils.getLatestRelease('owner', 'repo', 'userAgent', 30000);
                assert.fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.be.equal(
                    'Unexpected redirect URL: https://github.com/owner/wrong/ for URL: https://github.com/owner/repo/releases/latest',
                );
            }
        });
    });
    describe('Utils', async function () {
        describe('constructCommandArgs', async function () {
            it('should construct command arguments with minimum args', async function () {
                const args = {};
                const result = constructCommandArgs(args);
                expect(result).to.deep.equal(['run']);
            });

            it('should correctly construct command arguments with all args', async function () {
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
                    'fork',
                    'mainnet',
                    '--fork-at',
                    '100',
                ]);
            });

            it('should throw error when both forkBlockNumber and replayTx are specified in all args', async function () {
                const args = { fork: 'mainnet', forkBlockNumber: 100, replayTx: '0x1234567890abcdef' };
                expect(() => constructCommandArgs(args)).to.throw(
                    'Cannot specify both --fork-block-number and --replay-tx. Please specify only one of them.',
                );
            });

            it('should throw error for invalid log value', async function () {
                const args = { log: 'invalid' };
                expect(() => constructCommandArgs(args)).to.throw('Invalid log value: invalid');
            });

            it('should throw error when there is no fork arg', async function () {
                const args = { forkBlockNumber: 100 };
                expect(() => constructCommandArgs(args)).to.throw(
                    'Cannot specify --replay-tx or --fork-block-number parameters without --fork param.',
                );
            });

            it('should correctly construct command arguments with fork and replayTx', async function () {
                const args = { fork: 'http://example.com', replayTx: '0x1234567890abcdef' };
                const result = constructCommandArgs(args);
                expect(result).to.deep.equal(['replay_tx', 'http://example.com', '--tx', '0x1234567890abcdef']);
            });

            it('should throw error for invalid fork URL pattern', () => {
                const args = {
                    fork: 'invalidURL',
                };

                expect(() => constructCommandArgs(args)).to.throw('Invalid fork network value: invalidURL');
            });
        });
    });

    describe.skip('getNodeUrl', async function () {
        it('should return the node URL for the given repo and release', async function () {
            const repo = 'example/repo';
            const release = '1.0.0';
            const expectedUrl = `${repo}/releases/download/v${release}/anvil-zksync-v${release}-amd64-linux.tar.gz`;

            const url = await utils.getNodeUrl(repo, release);

            expect(url).to.equal(expectedUrl);
        });

        it('should throw an error for unsupported platforms', async function () {
            const repo = 'example/repo';
            const release = '1.0.0';
            const platform = 'windows';

            try {
                await utils.getNodeUrl(repo, release);
                // Fail the test if no error is thrown
                expect.fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.equal(`Unsupported platform: ${platform}`);
            }
        });
    });

    describe('waitForNodeToBeReady', async function () {
        afterEach(() => {
            sinon.restore();
        });

        it('should return successfully if the node is ready', async function () {
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

    describe('adjustTaskArgsForPort', async function () {
        it("should correctly add the --port argument if it's not present", async function () {
            const result = utils.adjustTaskArgsForPort([], 8000);
            expect(result).to.deep.equal(['--port', '8000']);
        });

        it("should correctly update the --port argument if it's present", async function () {
            const result = utils.adjustTaskArgsForPort(['--port', '9000'], 8000);
            expect(result).to.deep.equal(['--port', '8000']);
        });
    });

    describe('isPortAvailable', async function () {
        let server: net.Server;

        afterEach(() => {
            if (server) server.close();
        });

        it('should correctly identify an available port', async function () {
            const port = await getPort();
            const result = await utils.isPortAvailable(port);
            expect(result).to.equal(true);
        });

        it('should correctly identify a port that is in use', async function () {
            const port = await getPort();
            server = net.createServer().listen(port);
            const result = await utils.isPortAvailable(port);
            expect(result).to.equal(false);
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

        it('should return the first available port', async function () {
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

    describe('RPCServerDownloader', async function () {
        const mockRelease = '1.0.0';

        const mockUrl =
            'https://github.com/matter-labs/anvil-zksync/releases/download/v0.1.0/era_test_node-v0.1.0-aarch64-apple-darwin.tar.gz';

        let downloadStub: sinon.SinonStub;
        let existsSyncStub: sinon.SinonStub;
        let postProcessDownloadStub: sinon.SinonStub;
        let releaseStub: sinon.SinonStub;
        let urlStub: sinon.SinonStub;

        beforeEach(() => {
            downloadStub = sinon.stub(utils, 'download');
            releaseStub = sinon.stub(utils, 'getLatestRelease');
            urlStub = sinon.stub(utils, 'getNodeUrl');
            existsSyncStub = sinon.stub(fs, 'existsSync');
            postProcessDownloadStub = sinon
                .stub(RPCServerDownloader.prototype as any, '_postProcessDownload')
                .resolves(); // Stubbing the private method
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('download', () => {
            it('should download the binary if not already downloaded', async function () {
                const downloader = new RPCServerDownloader('../cache/node', 'latest');

                existsSyncStub.resolves(false);
                releaseStub.resolves(mockRelease);
                urlStub.resolves(mockUrl);
                downloadStub.resolves('v1.0.0');

                await downloader.downloadIfNeeded(false);

                sinon.assert.calledOnce(downloadStub);
                sinon.assert.calledOnce(postProcessDownloadStub);
                sinon.assert.calledOnce(releaseStub);
            });

            it('should force download the binary', async function () {
                const downloader = new RPCServerDownloader('../cache/node', 'latest');

                existsSyncStub.resolves(false);
                releaseStub.resolves(mockRelease);
                urlStub.resolves(mockUrl);
                downloadStub.resolves('v1.0.0');

                await downloader.downloadIfNeeded(true);

                sinon.assert.calledOnce(downloadStub);
                sinon.assert.calledOnce(postProcessDownloadStub);
                sinon.assert.calledOnce(releaseStub);
            });

            it('should throw an error if download fails', async function () {
                const downloader = new RPCServerDownloader('../cache/node', 'latest');

                downloadStub.throws(new Error('Mocked download failure'));
                existsSyncStub.resolves(false);
                releaseStub.resolves(mockRelease);
                urlStub.resolves(mockRelease);

                try {
                    await downloader.downloadIfNeeded(false);
                    expect.fail('Expected an error to be thrown');
                } catch (error: any) {
                    expect(error.message).to.contain('Error downloading binary from URL');
                }
            });
        });
    });

    describe('JsonRpcServer', async function () {
        interface SpawnSyncError extends Error {
            signal?: string;
        }

        const spawnStub = sinon.stub();
        let consoleInfoStub: sinon.SinonStub;

        // Because we cannot stub the execSync method directly, we use proxyquire to stub the entire 'child_process' module
        const { JsonRpcServer } = proxyquire('../src/server', {
            child_process: { spawn: spawnStub },
        });

        beforeEach(() => {
            spawnStub.reset();
            consoleInfoStub = sinon.stub(console, 'info');
        });

        afterEach(() => {
            consoleInfoStub.restore();
        });

        describe('listen', async function () {
            it('should start the JSON-RPC server with the provided arguments', async function () {
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

            it.skip('should handle termination signals gracefully', async function () {
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
                    chalk.yellow(`Received ${PROCESS_TERMINATION_SIGNALS[0]} signal. The server process has exited.`),
                );
            });

            it('should throw an error if the server process exits with an error', async function () {
                const server = new JsonRpcServer('/path/to/binary');
                const error = new Error('Mocked error');
                spawnStub.throws(error);

                try {
                    server.listen();
                    expect.fail('Expected an error to be thrown');
                } catch (err: any) {
                    expect(err.message).to.equal('Expected an error to be thrown');
                }
            });
        });
    });

    describe('TASK_NODE_ZKSYNC', async function () {
        this.timeout(10000); // Increase timeout if needed

        let serverProcess: ChildProcess;

        function _delay(ms: number): Promise<void> {
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
