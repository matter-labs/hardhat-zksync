import path from 'path';
import axios from 'axios';
import util from 'util';
import fs from 'fs';
import fse from 'fs-extra';
import { exec } from 'child_process';
import type { Dispatcher } from 'undici';

import {
    ALLOWED_CACHE_VALUES,
    ALLOWED_FORK_VALUES,
    ALLOWED_LOG_VALUES,
    ALLOWED_SHOW_CALLS_VALUES,
    ALLOWED_SHOW_GAS_DETAILS_VALUES,
    ALLOWED_SHOW_STORAGE_LOGS_VALUES,
    ALLOWED_SHOW_VM_DETAILS_VALUES,
    PLATFORM_MAP,
    TEMP_FILE_PREFIX,
} from './constants';
import { ZkSyncNodePluginError } from './errors';
import { CommandArguments } from './types';

import { getCompilersDir } from 'hardhat/internal/util/global-dir';

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

    if (args.fork) {
        const urlPattern = /^http(s)?:\/\/[^\s]+$/;
        if (!ALLOWED_FORK_VALUES.includes(args.fork) && !urlPattern.test(args.fork)) {
            throw new ZkSyncNodePluginError(`Invalid fork network value: ${args.fork}`);
        }

        // Throw an error if both forkBlockNumber and replayTx are specified
        if (args.forkBlockNumber && args.replayTx) {
            throw new ZkSyncNodePluginError(
                `Cannot specify both --fork-block-number and --replay-tx. Please specify only one of them.`
            );
        }

        if (args.forkBlockNumber) {
            commandArgs.push(`fork --fork-at ${args.forkBlockNumber} ${args.fork}`);
        } else if(args.replayTx) {
            commandArgs.push(`replay_tx ${args.fork} ${args.replayTx}`);
        } else {
            commandArgs.push(`fork ${args.fork}`);
        }
    } else {
        commandArgs.push('run');
    }

    return commandArgs;
}

function getPlatform() {
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
export async function getLatestRelease(owner: string, repo: string, userAgent: string): Promise<any> {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': userAgent,
            },
        });

        return response.data;
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code outside of the range of 2xx
            throw new ZkSyncNodePluginError(
                `Failed to get latest release for ${owner}/${repo}. Status: ${
                    error.response.status
                }, Data: ${JSON.stringify(error.response.data)}`
            );
        } else if (error.request) {
            // The request was made but no response was received
            throw new ZkSyncNodePluginError(`No response received for ${owner}/${repo}. Error: ${error.message}`);
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new ZkSyncNodePluginError(`Failed to set up the request for ${owner}/${repo}: ${error.message}`);
        }
    }
}

// Get the asset to download from the latest release of the era-test-node binary
export async function getAssetToDownload(latestRelease: any): Promise<string> {
    const platform = getPlatform();

    // TODO: Add support for Windows
    if (platform === 'windows' || platform === '') {
        throw new ZkSyncNodePluginError(`Unsupported platform: ${platform}`);
    }

    const prefix = 'era_test_node-' + latestRelease.tag_name;
    const expectedAssetName = `${prefix}-${getArch()}-${platform}.tar.gz`;

    return latestRelease.assets.find((asset: any) => asset.name === expectedAssetName);
}

function isTarGzFile(filePath: string): boolean {
    return path.extname(filePath) === '.gz' && path.extname(path.basename(filePath, '.gz')) === '.tar';
}

function ensureTarGzExtension(filePath: string): string {
    return filePath.endsWith('.tar.gz') ? filePath : filePath + '.tar.gz';
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
        exec(`tar -xzf ${tmpFilePath} -C ${tempExtractionDir}`, (error, stdout, stderr) => {
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
    extraHeaders: { [name: string]: string } = {}
) {
    const { pipeline } = await import('stream');
    const { getGlobalDispatcher, request } = await import('undici');
    const streamPipeline = util.promisify(pipeline);

    let dispatcher: Dispatcher = getGlobalDispatcher();

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
