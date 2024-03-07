"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureNetwork = exports.adjustTaskArgsForPort = exports.getAvailablePort = exports.waitForNodeToBeReady = exports.isPortAvailable = exports.download = exports.getNodeUrl = exports.getLatestRelease = exports.getRPCServerBinariesDir = exports.getPlatform = exports.constructCommandArgs = void 0;
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const util_1 = __importDefault(require("util"));
const fs_1 = __importDefault(require("fs"));
const net_1 = __importDefault(require("net"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const child_process_1 = require("child_process");
const zksync_ethers_1 = require("zksync-ethers");
const global_dir_1 = require("hardhat/internal/util/global-dir");
const zksync_provider_adapter_1 = require("./zksync-provider-adapter");
const constants_1 = require("./constants");
const errors_1 = require("./errors");
// Generates command arguments for running the era-test-node binary
function constructCommandArgs(args) {
    const commandArgs = [];
    if (args.port) {
        commandArgs.push(`--port=${args.port}`);
    }
    if (args.log) {
        if (!constants_1.ALLOWED_LOG_VALUES.includes(args.log)) {
            throw new errors_1.ZkSyncNodePluginError(`Invalid log value: ${args.log}`);
        }
        commandArgs.push(`--log=${args.log}`);
    }
    if (args.logFilePath) {
        commandArgs.push(`--log-file-path=${args.logFilePath}`);
    }
    if (args.cache) {
        if (!constants_1.ALLOWED_CACHE_VALUES.includes(args.cache)) {
            throw new errors_1.ZkSyncNodePluginError(`Invalid cache value: ${args.cache}`);
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
        if (!constants_1.ALLOWED_SHOW_STORAGE_LOGS_VALUES.includes(args.showStorageLogs)) {
            throw new errors_1.ZkSyncNodePluginError(`Invalid showStorageLogs value: ${args.showStorageLogs}`);
        }
        commandArgs.push(`--show-storage-logs=${args.showStorageLogs}`);
    }
    if (args.showVmDetails) {
        if (!constants_1.ALLOWED_SHOW_VM_DETAILS_VALUES.includes(args.showVmDetails)) {
            throw new errors_1.ZkSyncNodePluginError(`Invalid showVmDetails value: ${args.showVmDetails}`);
        }
        commandArgs.push(`--show-vm-details=${args.showVmDetails}`);
    }
    if (args.showGasDetails) {
        if (!constants_1.ALLOWED_SHOW_GAS_DETAILS_VALUES.includes(args.showGasDetails)) {
            throw new errors_1.ZkSyncNodePluginError(`Invalid showGasDetails value: ${args.showGasDetails}`);
        }
        commandArgs.push(`--show-gas-details=${args.showGasDetails}`);
    }
    if (args.showCalls) {
        if (!constants_1.ALLOWED_SHOW_CALLS_VALUES.includes(args.showCalls)) {
            throw new errors_1.ZkSyncNodePluginError(`Invalid showCalls value: ${args.showCalls}`);
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
        throw new errors_1.ZkSyncNodePluginError(`Cannot specify both --fork-block-number and --replay-tx. Please specify only one of them.`);
    }
    if ((args.replayTx || args.forkBlockNumber) && !args.fork) {
        throw new errors_1.ZkSyncNodePluginError(`Cannot specify --replay-tx or --fork-block-number parameters without --fork param.`);
    }
    if (args.fork) {
        const urlPattern = /^http(s)?:\/\/[^\s]+$/;
        if (!constants_1.ALLOWED_FORK_VALUES.includes(args.fork) && !urlPattern.test(args.fork)) {
            throw new errors_1.ZkSyncNodePluginError(`Invalid fork network value: ${args.fork}`);
        }
        if (args.forkBlockNumber) {
            commandArgs.push(`fork --fork-at ${args.forkBlockNumber} ${args.fork}`);
        }
        else if (args.replayTx) {
            commandArgs.push(`replay_tx ${args.fork} ${args.replayTx}`);
        }
        else {
            commandArgs.push(`fork ${args.fork}`);
        }
    }
    else {
        commandArgs.push('run');
    }
    return commandArgs;
}
exports.constructCommandArgs = constructCommandArgs;
function getPlatform() {
    return constants_1.PLATFORM_MAP[process.platform] || '';
}
exports.getPlatform = getPlatform;
function getArch() {
    const arch = process.arch === 'x64' ? 'x86_64' : process.arch;
    return process.arch === 'arm64' ? 'aarch64' : arch;
}
// Returns the path to the directory where the era-test-node binary is/will be located
async function getRPCServerBinariesDir() {
    const compilersCachePath = await (0, global_dir_1.getCompilersDir)();
    const basePath = path_1.default.dirname(compilersCachePath);
    const rpcServerBinariesPath = path_1.default.join(basePath, 'zksync-memory-node');
    return rpcServerBinariesPath;
}
exports.getRPCServerBinariesDir = getRPCServerBinariesDir;
// Get latest release from GitHub of the era-test-node binary
async function getLatestRelease(owner, repo, userAgent, timeout) {
    const url = `https://github.com/${owner}/${repo}/releases/latest`;
    const redirectUrlPattern = `https://github.com/${owner}/${repo}/releases/tag/v`;
    const { request } = await Promise.resolve().then(() => __importStar(require('undici')));
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
        if (response.headers.location) {
            // Check if the redirect URL matches the expected pattern
            if (response.headers.location.startsWith(redirectUrlPattern)) {
                // Extract the tag from the redirect URL
                return response.headers.location.substring(redirectUrlPattern.length);
            }
            throw new errors_1.ZkSyncNodePluginError(`Unexpected redirect URL: ${response.headers.location} for URL: ${url}`);
        }
        else {
            // Throw an error if the 'location' header is missing in a redirect response
            throw new errors_1.ZkSyncNodePluginError(`Redirect location not found for URL: ${url}`);
        }
    }
    else {
        // Throw an error for non-redirect responses
        throw new errors_1.ZkSyncNodePluginError(`Unexpected response status: ${response.statusCode} for URL: ${url}`);
    }
}
exports.getLatestRelease = getLatestRelease;
// Get the asset to download from the latest release of the era-test-node binary
async function getNodeUrl(repo, release) {
    const platform = getPlatform();
    // TODO: Add support for Windows
    if (platform === 'windows' || platform === '') {
        throw new errors_1.ZkSyncNodePluginError(`Unsupported platform: ${platform}`);
    }
    return `${repo}/releases/download/v${release}/era_test_node-v${release}-${getArch()}-${platform}.tar.gz`;
}
exports.getNodeUrl = getNodeUrl;
function isTarGzFile(filePath) {
    return path_1.default.extname(filePath) === '.gz' && path_1.default.extname(path_1.default.basename(filePath, '.gz')) === '.tar';
}
function ensureTarGzExtension(filePath) {
    return filePath.endsWith('.tar.gz') ? filePath : `${filePath}.tar.gz`;
}
async function ensureDirectory(filePath) {
    await fs_extra_1.default.ensureDir(path_1.default.dirname(filePath));
}
async function moveFile(sourcePath, destinationPath) {
    await fs_extra_1.default.move(sourcePath, destinationPath, { overwrite: true });
}
function resolveTempFileName(filePath) {
    const { dir, ext, name } = path_1.default.parse(filePath);
    return path_1.default.format({
        dir,
        ext,
        name: `${constants_1.TEMP_FILE_PREFIX}${name}`,
    });
}
// Extracts the contents of a tar.gz archive to a file
async function extractTarGz(tmpFilePath, filePath) {
    const tempExtractionDir = path_1.default.join(path_1.default.dirname(tmpFilePath), `tmp_extract_${Date.now()}`);
    await fs_extra_1.default.ensureDir(tempExtractionDir);
    // Using native tar command for extraction
    await new Promise((resolve, reject) => {
        (0, child_process_1.exec)(`tar -xzf ${tmpFilePath} -C ${tempExtractionDir}`, (error, stdout, _stderr) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(stdout);
            }
        });
    });
    const filesInTempExtractionDir = await fs_extra_1.default.readdir(tempExtractionDir);
    if (filesInTempExtractionDir.length !== 1) {
        throw new Error('Expected a single file inside the tar.gz archive.');
    }
    const extractedFileName = filesInTempExtractionDir[0];
    const extractedFilePath = path_1.default.join(tempExtractionDir, extractedFileName);
    await moveFile(extractedFilePath, filePath.slice(0, -'.tar.gz'.length));
    await fs_extra_1.default.remove(tempExtractionDir);
}
// Downloads a file from a url and saves it to a file path
async function download(url, filePath, userAgent, version, timeoutMillis = 10000, extraHeaders = {}) {
    const { pipeline } = await Promise.resolve().then(() => __importStar(require('stream')));
    const { getGlobalDispatcher, request } = await Promise.resolve().then(() => __importStar(require('undici')));
    const streamPipeline = util_1.default.promisify(pipeline);
    const dispatcher = getGlobalDispatcher();
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
        await streamPipeline(response.body, fs_1.default.createWriteStream(tmpFilePath));
        if (isTarGzFile(url)) {
            filePath = ensureTarGzExtension(filePath);
            await extractTarGz(tmpFilePath, filePath);
        }
        else {
            await moveFile(tmpFilePath, filePath);
        }
        await fs_extra_1.default.remove(tmpFilePath);
        return;
    }
    // undici's response bodies must always be consumed to prevent leaks
    const text = await response.body.text();
    // eslint-disable-next-line
    throw new Error(`Failed to download ${url} - ${response.statusCode} received. ${text}`);
}
exports.download = download;
async function isPortAvailableForIP(port, ip) {
    return new Promise((resolve) => {
        const tester = net_1.default
            .createServer()
            .once('error', (err) => resolve(err.code !== 'EADDRINUSE'))
            .once('listening', () => tester.close(() => resolve(true)))
            .listen(port, ip);
    });
}
async function isPortAvailable(port) {
    const availableIPv4 = await isPortAvailableForIP(port, '0.0.0.0');
    const availableIPv6 = await isPortAvailableForIP(port, '::');
    return availableIPv4 && availableIPv6;
}
exports.isPortAvailable = isPortAvailable;
async function waitForNodeToBeReady(port, maxAttempts = 20) {
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
            const response = await axios_1.default.post(rpcEndpoint, payload);
            if (response.data && response.data.result) {
                return; // The node responded with a valid chain ID
            }
        }
        catch (e) {
            // console.error(`Attempt ${attempts + 1} failed with error:`, e.message);
            // If it fails, it will just try again
        }
        attempts++;
        // Wait before the next attempt
        await new Promise((r) => setTimeout(r, waitTime));
        // Update the wait time for the next attempt
        waitTime = Math.min(waitTime * backoffFactor, maxWaitTime);
    }
    throw new errors_1.ZkSyncNodePluginError("Server didn't respond after multiple attempts");
}
exports.waitForNodeToBeReady = waitForNodeToBeReady;
async function getAvailablePort(startPort, maxAttempts) {
    let currentPort = startPort;
    for (let i = 0; i < maxAttempts; i++) {
        if (await isPortAvailable(currentPort)) {
            return currentPort;
        }
        currentPort++;
    }
    throw new errors_1.ZkSyncNodePluginError("Couldn't find an available port after several attempts");
}
exports.getAvailablePort = getAvailablePort;
function adjustTaskArgsForPort(taskArgs, currentPort) {
    const portArg = '--port';
    const portArgIndex = taskArgs.indexOf(portArg);
    if (portArgIndex !== -1) {
        if (portArgIndex + 1 < taskArgs.length) {
            taskArgs[portArgIndex + 1] = `${currentPort}`;
        }
        else {
            throw new errors_1.ZkSyncNodePluginError('Invalid task arguments: --port provided without a following port number.');
        }
    }
    else {
        taskArgs.push(portArg, `${currentPort}`);
    }
    return taskArgs;
}
exports.adjustTaskArgsForPort = adjustTaskArgsForPort;
function getNetworkConfig(url) {
    return {
        accounts: constants_1.NETWORK_ACCOUNTS.REMOTE,
        gas: constants_1.NETWORK_GAS.AUTO,
        gasPrice: constants_1.NETWORK_GAS_PRICE.AUTO,
        gasMultiplier: 1,
        httpHeaders: {},
        timeout: 20000,
        url,
        ethNetwork: constants_1.NETWORK_ETH.LOCALHOST,
        zksync: true,
    };
}
function configureNetwork(network, port) {
    const url = `${constants_1.BASE_URL}:${port}`;
    network.name = constants_1.ZKSYNC_ERA_TEST_NODE_NETWORK_NAME;
    network.config = getNetworkConfig(url);
    network.provider = new zksync_provider_adapter_1.ZkSyncProviderAdapter(new zksync_ethers_1.Provider(url));
}
exports.configureNetwork = configureNetwork;
//# sourceMappingURL=utils.js.map