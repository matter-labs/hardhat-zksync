import path from 'path';
import axios from 'axios';
import util from 'util';
import fs from 'fs';
import net from 'net';
import fse from 'fs-extra';
import { exec } from 'child_process';
import type { Dispatcher } from 'undici';
import { getCompilersDir } from 'hardhat/internal/util/global-dir';
import { createProvider } from 'hardhat/internal/core/providers/construction';
import { HardhatConfig } from 'hardhat/types';

import {
    ALLOWED_CACHE_VALUES,
    ALLOWED_FORK_VALUES,
    ALLOWED_LOG_VALUES,
    ALLOWED_SHOW_CALLS_VALUES,
    ALLOWED_SHOW_GAS_DETAILS_VALUES,
    ALLOWED_SHOW_STORAGE_LOGS_VALUES,
    ALLOWED_SHOW_VM_DETAILS_VALUES,
    BASE_URL,
    NETWORK_ACCOUNTS,
    NETWORK_ETH,
    NETWORK_GAS,
    NETWORK_GAS_PRICE,
    PLATFORM_MAP,
    TEMP_FILE_PREFIX,
    ZKSYNC_ERA_TEST_NODE_NETWORK_NAME,
} from './constants';
import { ZkSyncNodePluginError } from './errors';
import { CommandArguments } from './types';

// Generates command arguments for running the era-test-node binary
export function constructCommandArgs(args: CommandArguments): string[] {
    const commandArgs: string[] = [];

    if (args.port) {
        commandArgs.push(`--port=${args.port}`);
    }

    if (args.log) {
        if (!ALLOWED_LOG_VALUES.includes(args.log)) {
            throw new ZkSyncNodePluginError(`Invalid log value: ${args.log}`);
        }
        commandArgs.push(`--log=${args.log}`);
    }

    if (args.logFilePath) {
        commandArgs.push(`--log-file-path=${args.logFilePath}`);
    }

    if (args.cache) {
        if (!ALLOWED_CACHE_VALUES.includes(args.cache)) {
            throw new ZkSyncNodePluginError(`Invalid cache value: ${args.cache}`);
        }
        commandArgs.push(`--cache=${args.cache}`);
    }

    if (args.cacheDir) {
        commandArgs.push(`--cache-dir=${args.cacheDir}`);
    }

    if (args.resetCache) {
        commandArgs.push(`--reset-cache`);
    }

    if (args.showStorageLogs) {
        if (!ALLOWED_SHOW_STORAGE_LOGS_VALUES.includes(args.showStorageLogs)) {
            throw new ZkSyncNodePluginError(`Invalid showStorageLogs value: ${args.showStorageLogs}`);
        }
        commandArgs.push(`--show-storage-logs=${args.showStorageLogs}`);
    }

    if (args.showVmDetails) {
        if (!ALLOWED_SHOW_VM_DETAILS_VALUES.includes(args.showVmDetails)) {
            throw new ZkSyncNodePluginError(`Invalid showVmDetails value: ${args.showVmDetails}`);
        }
        commandArgs.push(`--show-vm-details=${args.showVmDetails}`);
    }

    if (args.showGasDetails) {
        if (!ALLOWED_SHOW_GAS_DETAILS_VALUES.includes(args.showGasDetails)) {
            throw new ZkSyncNodePluginError(`Invalid showGasDetails value: ${args.showGasDetails}`);
        }
        commandArgs.push(`--show-gas-details=${args.showGasDetails}`);
    }

    if (args.showCalls) {
        if (!ALLOWED_SHOW_CALLS_VALUES.includes(args.showCalls)) {
            throw new ZkSyncNodePluginError(`Invalid showCalls value: ${args.showCalls}`);
        }
        commandArgs.push(`--show-calls=${args.showCalls}`);
    }

    if (args.resolveHashes) {
        commandArgs.push(`--resolve-hashes`);
    }

    if (args.devUseLocalContracts) {
        commandArgs.push(`--dev-use-local-contracts`);
    }

    if (args.forkBlockNumber && args.replayTx) {
        throw new ZkSyncNodePluginError(
            `Cannot specify both --fork-block-number and --replay-tx. Please specify only one of them.`,
        );
    }

    if ((args.replayTx || args.forkBlockNumber) && !args.fork) {
        throw new ZkSyncNodePluginError(
            `Cannot specify --replay-tx or --fork-block-number parameters without --fork param.`,
        );
    }

    if (args.fork) {
        const urlPattern = /^http(s)?:\/\/[^\s]+$/;
        if (!ALLOWED_FORK_VALUES.includes(args.fork) && !urlPattern.test(args.fork)) {
            throw new ZkSyncNodePluginError(`Invalid fork network value: ${args.fork}`);
        }

        if (args.forkBlockNumber) {
            commandArgs.push('fork', args.fork, '--fork-at', args.forkBlockNumber.toString());
        } else if (args.replayTx) {
            commandArgs.push('replay_tx', args.fork, '--tx', args.replayTx);
        } else {
            commandArgs.push('fork', args.fork);
        }
    } else {
        commandArgs.push('run');
    }

    return commandArgs;
}

export function getPlatform() {
    return PLATFORM_MAP[process.platform] || '';
}

function getArch() {
    const arch = process.arch === 'x64' ? 'x86_64' : process.arch;
    return process.arch === 'arm64' ? 'aarch64' : arch;
}

// Returns the path to the directory where the era-test-node binary is/will be located
export async function getRPCServerBinariesDir(): Promise<string> {
    const compilersCachePath = await getCompilersDir();
    const basePath = path.dirname(compilersCachePath);
    const rpcServerBinariesPath = path.join(basePath, 'zksync-memory-node');

    return rpcServerBinariesPath;
}

// Get latest release from GitHub of the era-test-node binary
export async function getLatestRelease(owner: string, repo: string, userAgent: string, timeout: number): Promise<any> {
    const url = `https://github.com/${owner}/${repo}/releases/latest`;
    const redirectUrlPattern = `https://github.com/${owner}/${repo}/releases/tag/v`;

    const { request } = await import('undici');

    const response = await request(url, {
        headersTimeout: timeout,
        maxRedirections: 0,
        method: 'GET',
        headers: {
            'User-Agent': `${userAgent}`,
        },
    });

    // Check if the response is a redirect
    if (response.statusCode >= 300 && response.statusCode < 400) {
        // Get the URL from the 'location' header
        if (response.headers.location && typeof response.headers.location === 'string') {
            // Check if the redirect URL matches the expected pattern
            if (response.headers.location.startsWith(redirectUrlPattern)) {
                // Extract the tag from the redirect URL
                return response.headers.location.substring(redirectUrlPattern.length);
            }

            throw new ZkSyncNodePluginError(`Unexpected redirect URL: ${response.headers.location} for URL: ${url}`);
        } else {
            // Throw an error if the 'location' header is missing in a redirect response
            throw new ZkSyncNodePluginError(`Redirect location not found for URL: ${url}`);
        }
    } else {
        // Throw an error for non-redirect responses
        throw new ZkSyncNodePluginError(`Unexpected response status: ${response.statusCode} for URL: ${url}`);
    }
}

// Get the asset to download from the latest release of the era-test-node binary
export async function getNodeUrl(repo: string, release: string): Promise<string> {
    const platform = getPlatform();

    // TODO: Add support for Windows
    if (platform === 'windows' || platform === '') {
        throw new ZkSyncNodePluginError(`Unsupported platform: ${platform}`);
    }

    return `${repo}/releases/download/v${release}/era_test_node-v${release}-${getArch()}-${platform}.tar.gz`;
}

function isTarGzFile(filePath: string): boolean {
    return path.extname(filePath) === '.gz' && path.extname(path.basename(filePath, '.gz')) === '.tar';
}

function ensureTarGzExtension(filePath: string): string {
    return filePath.endsWith('.tar.gz') ? filePath : `${filePath}.tar.gz`;
}

async function ensureDirectory(filePath: string): Promise<void> {
    await fse.ensureDir(path.dirname(filePath));
}

async function moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    await fse.move(sourcePath, destinationPath, { overwrite: true });
}

function resolveTempFileName(filePath: string): string {
    const { dir, ext, name } = path.parse(filePath);

    return path.format({
        dir,
        ext,
        name: `${TEMP_FILE_PREFIX}${name}`,
    });
}

// Extracts the contents of a tar.gz archive to a file
async function extractTarGz(tmpFilePath: string, filePath: string): Promise<void> {
    const tempExtractionDir = path.join(path.dirname(tmpFilePath), `tmp_extract_${Date.now()}`);
    await fse.ensureDir(tempExtractionDir);

    // Using native tar command for extraction
    await new Promise((resolve, reject) => {
        exec(`tar -xzf ${tmpFilePath} -C ${tempExtractionDir}`, (error, stdout, _stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });

    const filesInTempExtractionDir = await fse.readdir(tempExtractionDir);
    if (filesInTempExtractionDir.length !== 1) {
        throw new Error('Expected a single file inside the tar.gz archive.');
    }

    const extractedFileName = filesInTempExtractionDir[0];
    const extractedFilePath = path.join(tempExtractionDir, extractedFileName);

    await moveFile(extractedFilePath, filePath.slice(0, -'.tar.gz'.length));
    await fse.remove(tempExtractionDir);
}

// Downloads a file from a url and saves it to a file path
export async function download(
    url: string,
    filePath: string,
    userAgent: string,
    version: string,
    timeoutMillis = 10000,
    extraHeaders: { [name: string]: string } = {},
) {
    const { pipeline } = await import('stream');
    const { getGlobalDispatcher, request } = await import('undici');
    const streamPipeline = util.promisify(pipeline);

    const dispatcher: Dispatcher = getGlobalDispatcher();

    // Fetch the url
    const response = await request(url, {
        dispatcher,
        headersTimeout: timeoutMillis,
        maxRedirections: 10,
        method: 'GET',
        headers: {
            ...extraHeaders,
            'User-Agent': `${userAgent} ${version}`,
        },
    });

    if (response.statusCode >= 200 && response.statusCode <= 299) {
        const tmpFilePath = resolveTempFileName(filePath);
        await ensureDirectory(filePath);
        await streamPipeline(response.body, fs.createWriteStream(tmpFilePath));

        if (isTarGzFile(url)) {
            filePath = ensureTarGzExtension(filePath);
            await extractTarGz(tmpFilePath, filePath);
        } else {
            await moveFile(tmpFilePath, filePath);
        }

        await fse.remove(tmpFilePath);
        return;
    }

    // undici's response bodies must always be consumed to prevent leaks
    const text = await response.body.text();

    // eslint-disable-next-line
    throw new Error(`Failed to download ${url} - ${response.statusCode} received. ${text}`);
}

async function isPortAvailableForIP(port: number, ip: string): Promise<boolean> {
    return new Promise((resolve) => {
        const tester: net.Server = net
            .createServer()
            .once('error', (err: any) => resolve(err.code !== 'EADDRINUSE'))
            .once('listening', () => tester.close(() => resolve(true)))
            .listen(port, ip);
    });
}

export async function isPortAvailable(port: number): Promise<boolean> {
    const availableIPv4 = await isPortAvailableForIP(port, '0.0.0.0');
    const availableIPv6 = await isPortAvailableForIP(port, '::');
    return availableIPv4 && availableIPv6;
}

export async function waitForNodeToBeReady(port: number, maxAttempts: number = 20): Promise<void> {
    const rpcEndpoint = `http://127.0.0.1:${port}`;

    const payload = {
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: new Date().getTime(),
    };

    let attempts = 0;
    let waitTime = 1000; // Initial wait time in milliseconds
    const backoffFactor = 2;
    const maxWaitTime = 30000; // Maximum wait time (e.g., 30 seconds)

    while (attempts < maxAttempts) {
        try {
            const response = await axios.post(rpcEndpoint, payload);

            if (response.data && response.data.result) {
                return; // The node responded with a valid chain ID
            }
        } catch (e: any) {
            // console.error(`Attempt ${attempts + 1} failed with error:`, e.message);
            // If it fails, it will just try again
        }

        attempts++;

        // Wait before the next attempt
        await new Promise((r) => setTimeout(r, waitTime));

        // Update the wait time for the next attempt
        waitTime = Math.min(waitTime * backoffFactor, maxWaitTime);
    }

    throw new ZkSyncNodePluginError("Server didn't respond after multiple attempts");
}

export async function getAvailablePort(startPort: number, maxAttempts: number): Promise<number> {
    let currentPort = startPort;
    for (let i = 0; i < maxAttempts; i++) {
        if (await isPortAvailable(currentPort)) {
            return currentPort;
        }
        currentPort++;
    }
    throw new ZkSyncNodePluginError("Couldn't find an available port after several attempts");
}

export function adjustTaskArgsForPort(taskArgs: string[], currentPort: number): string[] {
    const portArg = '--port';
    const portArgIndex = taskArgs.indexOf(portArg);
    if (portArgIndex !== -1) {
        if (portArgIndex + 1 < taskArgs.length) {
            taskArgs[portArgIndex + 1] = `${currentPort}`;
        } else {
            throw new ZkSyncNodePluginError('Invalid task arguments: --port provided without a following port number.');
        }
    } else {
        taskArgs.push(portArg, `${currentPort}`);
    }
    return taskArgs;
}

function getNetworkConfig(url: string) {
    return {
        accounts: NETWORK_ACCOUNTS.REMOTE,
        gas: NETWORK_GAS.AUTO,
        gasPrice: NETWORK_GAS_PRICE.AUTO,
        gasMultiplier: 1,
        httpHeaders: {},
        timeout: 20000,
        url,
        ethNetwork: NETWORK_ETH.LOCALHOST,
        zksync: true,
    };
}

export async function configureNetwork(config: HardhatConfig, network: any, port: number) {
    const url = `${BASE_URL}:${port}`;

    network.name = ZKSYNC_ERA_TEST_NODE_NETWORK_NAME;
    network.config = getNetworkConfig(url);
    config.networks[network.name] = network.config;
    network.provider = await createProvider(config, network.name);
}
