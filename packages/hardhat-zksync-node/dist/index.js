"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZkSyncProviderAdapter = void 0;
const child_process_1 = require("child_process");
const config_1 = require("hardhat/config");
const task_names_1 = require("hardhat/builtin-tasks/task-names");
const plugins_1 = require("hardhat/plugins");
const constants_1 = require("./constants");
const server_1 = require("./server");
const utils_1 = require("./utils");
const downloader_1 = require("./downloader");
const errors_1 = require("./errors");
// Subtask to download the binary
(0, config_1.subtask)(constants_1.TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, 'Downloads the JSON-RPC server binary')
    .addFlag('force', 'Force download even if the binary already exists')
    .addOptionalParam('tag', 'Specified node release for use', undefined)
    .setAction(async ({ force, tag, }, _hre) => {
    // Directory where the binaries are stored
    const rpcServerBinaryDir = await (0, utils_1.getRPCServerBinariesDir)();
    // Get the latest release of the binary
    const downloader = new downloader_1.RPCServerDownloader(rpcServerBinaryDir, tag || 'v0.0.1-vm1.5.0');
    // Download binary if needed
    await downloader.downloadIfNeeded(force);
    return await downloader.getBinaryPath();
});
// Subtask to create the server
(0, config_1.subtask)(constants_1.TASK_NODE_ZKSYNC_CREATE_SERVER, 'Creates a JSON-RPC server for zkSync node')
    .addParam('binaryPath', 'Path to the binary file', undefined, config_1.types.string)
    .setAction(async ({ binaryPath, }, _hre) => {
    // Create the server
    const server = new server_1.JsonRpcServer(binaryPath);
    return server;
});
// Main task of the plugin. It starts the server and listens for requests.
(0, config_1.task)(constants_1.TASK_NODE_ZKSYNC, 'Starts a JSON-RPC server for zkSync node')
    .addOptionalParam('port', 'Port to listen on - default: 8011', undefined, config_1.types.int)
    .addOptionalParam('log', 'Log filter level (error, warn, info, debug) - default: info', undefined, config_1.types.string)
    .addOptionalParam('logFilePath', 'Path to the file where logs should be written - default: `era_test_node.log`', undefined, config_1.types.string)
    .addOptionalParam('cache', 'Cache type (none, disk, memory) - default: disk', undefined, config_1.types.string)
    .addOptionalParam('cacheDir', 'Cache directory location for `disk` cache - default: `.cache`', undefined, config_1.types.string)
    .addFlag('resetCache', 'Reset the local `disk` cache')
    .addOptionalParam('showCalls', 'Show call debug information (none, user, system, all) - default: none', undefined, config_1.types.string)
    .addOptionalParam('showStorageLogs', 'Show storage log information (none, read, write, all) - default: none', undefined, config_1.types.string)
    .addOptionalParam('showVmDetails', 'Show VM details information (none, all) - default: none', undefined, config_1.types.string)
    .addOptionalParam('showGasDetails', 'Show Gas details information (none, all) - default: none', undefined, config_1.types.string)
    .addFlag('resolveHashes', 'Try to contact openchain to resolve the ABI & topic names. It enabled, it makes debug log more readable, but will decrease the performance')
    .addFlag('devUseLocalContracts', 'Loads the locally compiled system contracts (useful when doing changes to system contracts or bootloader)')
    .addOptionalParam('fork', 'Starts a local network that is a fork of another network (testnet, mainnet, http://XXX:YY)', undefined, config_1.types.string)
    .addOptionalParam('forkBlockNumber', 'Fork at the specified block height', undefined, config_1.types.int)
    .addOptionalParam('replayTx', 'Transaction hash to replay', undefined, config_1.types.string)
    .addOptionalParam('tag', 'Specified node release for use', undefined)
    // .addFlag('force', 'Force download even if the binary already exists')
    .setAction(async ({ port, log, logFilePath, cache, cacheDir, resetCache, showCalls, showStorageLogs, showVmDetails, showGasDetails, resolveHashes, devUseLocalContracts, fork, forkBlockNumber, replayTx, tag, }, { run }) => {
    const commandArgs = (0, utils_1.constructCommandArgs)({
        port,
        log,
        logFilePath,
        cache,
        cacheDir,
        resetCache,
        showCalls,
        showStorageLogs,
        showVmDetails,
        showGasDetails,
        resolveHashes,
        devUseLocalContracts,
        fork,
        forkBlockNumber,
        replayTx,
    });
    // Download the binary
    const binaryPath = await run(constants_1.TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, { force: false, tag });
    // Create the server
    const server = await run(constants_1.TASK_NODE_ZKSYNC_CREATE_SERVER, { binaryPath });
    try {
        await server.listen(commandArgs);
    }
    catch (error) {
        throw new errors_1.ZkSyncNodePluginError(`Failed when running node: ${error.message}`);
    }
});
(0, config_1.subtask)(constants_1.TASK_RUN_NODE_ZKSYNC_IN_SEPARATE_PROCESS, 'Runs a Hardhat node-zksync task in a separate process.')
    .addVariadicPositionalParam('taskArgs', 'Arguments for the Hardhat node-zksync task.')
    .setAction(async ({ taskArgs = [] }, _hre) => {
    const currentPort = await (0, utils_1.getAvailablePort)(constants_1.START_PORT, constants_1.MAX_PORT_ATTEMPTS);
    const adjustedArgs = (0, utils_1.adjustTaskArgsForPort)(taskArgs, currentPort);
    const taskProcess = (0, child_process_1.spawn)('npx', ['hardhat', constants_1.TASK_NODE_ZKSYNC, ...adjustedArgs], {
        detached: true, // This creates a separate process group
        // stdio: 'inherit',
    });
    return {
        process: taskProcess,
        port: currentPort,
    };
});
(0, config_1.task)(task_names_1.TASK_TEST, async ({ testFiles, noCompile, parallel, bail, grep, }, { run, network }, runSuper) => {
    if (network.zksync !== true || network.name !== plugins_1.HARDHAT_NETWORK_NAME) {
        return await runSuper();
    }
    const platform = (0, utils_1.getPlatform)();
    if (platform === 'windows' || platform === '') {
        throw new errors_1.ZkSyncNodePluginError(`Unsupported platform: ${platform}`);
    }
    if (!noCompile) {
        await run(task_names_1.TASK_COMPILE, { quiet: true });
    }
    const files = await run(task_names_1.TASK_TEST_GET_TEST_FILES, { testFiles });
    // Download the binary, if necessary
    const binaryPath = await run(constants_1.TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, { force: false });
    const currentPort = await (0, utils_1.getAvailablePort)(constants_1.START_PORT, constants_1.MAX_PORT_ATTEMPTS);
    const commandArgs = (0, utils_1.constructCommandArgs)({ port: currentPort });
    const server = new server_1.JsonRpcServer(binaryPath);
    try {
        await server.listen(commandArgs, false);
        await (0, utils_1.waitForNodeToBeReady)(currentPort);
        (0, utils_1.configureNetwork)(network, currentPort);
        let testFailures = 0;
        try {
            // Run the tests
            testFailures = await run(task_names_1.TASK_TEST_RUN_MOCHA_TESTS, {
                testFiles: files,
                parallel,
                bail,
                grep,
            });
        }
        finally {
            await server.stop();
        }
        process.exitCode = testFailures;
        return testFailures;
    }
    catch (error) {
        throw new errors_1.ZkSyncNodePluginError(`Failed when running node: ${error.message}`);
    }
});
var zksync_provider_adapter_1 = require("./zksync-provider-adapter");
Object.defineProperty(exports, "ZkSyncProviderAdapter", { enumerable: true, get: function () { return zksync_provider_adapter_1.ZkSyncProviderAdapter; } });
//# sourceMappingURL=index.js.map