import { spawn } from 'child_process';
import { task, subtask, types } from 'hardhat/config';
import { TASK_COMPILE, TASK_TEST, TASK_TEST_GET_TEST_FILES, TASK_TEST_RUN_MOCHA_TESTS, TASK_TEST_RUN_SHOW_FORK_RECOMMENDATIONS, TASK_TEST_SETUP_TEST_ENVIRONMENT } from 'hardhat/builtin-tasks/task-names';
import { Provider } from 'zksync-web3';

import {
    PLUGIN_NAME,
    PROCESS_TERMINATION_SIGNALS,
    TASK_NODE_ZKSYNC,
    TASK_NODE_ZKSYNC_CREATE_SERVER,
    TASK_NODE_ZKSYNC_DOWNLOAD_BINARY,
    TASK_RUN_TASK_IN_SEPARATE_PROCESS,
    ZKNODE_BIN_OWNER,
    ZKNODE_BIN_REPOSITORY_NAME,
} from './constants';
import { JsonRpcServer } from './server';
import { constructCommandArgs, getAssetToDownload, getLatestRelease, getRPCServerBinariesDir } from './utils';
import { RPCServerDownloader } from './downloader';
import { ZkSyncNodePluginError } from './errors';

// Subtask to download the binary
subtask(TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, 'Downloads the JSON-RPC server binary')
    .addFlag('force', 'Force download even if the binary already exists')
    .setAction(
        async (
            {
                force,
            }: {
                force: boolean;
            },
            hre
        ) => {
            // Directory where the binaries are stored
            const rpcServerBinaryDir = await getRPCServerBinariesDir();

            // Get the latest release of the binary
            const latestRelease = await getLatestRelease(ZKNODE_BIN_OWNER, ZKNODE_BIN_REPOSITORY_NAME, PLUGIN_NAME);
            const downloader: RPCServerDownloader = new RPCServerDownloader(rpcServerBinaryDir, latestRelease.tag_name);

            // Check if the binary is already downloaded
            if (!force && (await downloader.isDownloaded())) {
                return downloader.getBinaryPath();
            }

            // Download the binary
            const assetToDownload: any = await getAssetToDownload(latestRelease);
            await downloader.download(assetToDownload.browser_download_url);

            return downloader.getBinaryPath();
        }
    );

// Subtask to create the server
subtask(TASK_NODE_ZKSYNC_CREATE_SERVER, 'Creates a JSON-RPC server for zkSync node')
    .addParam('binaryPath', 'Path to the binary file', undefined, types.string)
    .setAction(
        async (
            {
                binaryPath,
            }: {
                binaryPath: string;
            },
            hre
        ) => {
            // Create the server
            const server: JsonRpcServer = new JsonRpcServer(binaryPath);

            return server;
        }
    );

// Main task of the plugin. It starts the server and listens for requests.
task(TASK_NODE_ZKSYNC, 'Starts a JSON-RPC server for zkSync node')
    .addOptionalParam('port', 'Port to listen on - default: 8011', undefined, types.int)
    .addOptionalParam('log', 'Log filter level (error, warn, info, debug) - default: info', undefined, types.string)
    .addOptionalParam(
        'logFilePath',
        'Path to the file where logs should be written - default: `era_test_node.log`',
        undefined,
        types.string
    )
    .addOptionalParam('cache', 'Cache type (none, disk, memory) - default: disk', undefined, types.string)
    .addOptionalParam(
        'cacheDir',
        'Cache directory location for `disk` cache - default: `.cache`',
        undefined,
        types.string
    )
    .addFlag('resetCache', 'Reset the local `disk` cache')
    .addOptionalParam(
        'showCalls',
        'Show call debug information (none, user, system, all) - default: none',
        undefined,
        types.string
    )
    .addOptionalParam(
        'showStorageLogs',
        'Show storage log information (none, read, write, all) - default: none',
        undefined,
        types.string
    )
    .addOptionalParam(
        'showVmDetails',
        'Show VM details information (none, all) - default: none',
        undefined,
        types.string
    )
    .addOptionalParam(
        'showGasDetails',
        'Show Gas details information (none, all) - default: none',
        undefined,
        types.string
    )
    .addFlag(
        'resolveHashes',
        'Try to contact openchain to resolve the ABI & topic names. It enabled, it makes debug log more readable, but will decrease the performance'
    )
    .addFlag(
        'devUseLocalContracts',
        'Loads the locally compiled system contracts (useful when doing changes to system contracts or bootloader)'
    )
    .addOptionalParam(
        'fork',
        'Starts a local network that is a fork of another network (testnet, mainnet, http://XXX:YY)',
        undefined,
        types.string
    )
    .addOptionalParam('forkBlockNumber', 'Fork at the specified block height', undefined, types.int)
    .addOptionalParam('replayTx', 'Transaction hash to replay', undefined, types.string)
    // .addFlag('force', 'Force download even if the binary already exists')
    .setAction(
        async (
            {
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
            }: {
                port: number;
                log: string;
                logFilePath: string;
                cache: string;
                cacheDir: string;
                resetCache: boolean;
                showCalls: string;
                showStorageLogs: string;
                showVmDetails: string;
                showGasDetails: string;
                resolveHashes: boolean;
                devUseLocalContracts: boolean;
                fork: string;
                forkBlockNumber: number;
                replayTx: string;
            },
            { run }
        ) => {
            const commandArgs = constructCommandArgs({
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
            const binaryPath: string = await run(TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, { force: false });

            // Create the server
            const server: JsonRpcServer = await run(TASK_NODE_ZKSYNC_CREATE_SERVER, { binaryPath });

            try {
                server.listen(commandArgs);
            } catch (error: any) {
                throw new ZkSyncNodePluginError(error.message);
            }
        }
    );

subtask(TASK_RUN_TASK_IN_SEPARATE_PROCESS, "Runs a Hardhat task in a separate process.")
    .addParam("taskName", "The name of the Hardhat task to run.", undefined, types.string)
    .addVariadicPositionalParam("taskArgs", "Arguments for the Hardhat task.")
    .setAction(async ({ taskName, taskArgs = [] }, hre) => {
        const taskProcess = spawn('npx', ['hardhat', taskName, ...taskArgs], {
            detached: true, // This creates a separate process group
        });

        return taskProcess;
    });

task(TASK_TEST, async (
    {
        testFiles,
        noCompile,
        parallel,
        bail,
        grep,
    }: {
        testFiles: string[];
        noCompile: boolean;
        parallel: boolean;
        bail: boolean;
        grep?: string;
    },
    { run, network },
    runSuper
) => {
    if (network.zksync !== true) {
        return await runSuper();
    }

    if (!noCompile) {
        await run(TASK_COMPILE, { quiet: true });
    }

    const files = await run(TASK_TEST_GET_TEST_FILES, { testFiles });

    // Start the zkSync node using TASK_RUN_TASK_IN_SEPARATE_PROCESS
    const taskArgs: any[] = [/* Add necessary arguments here */];
    const taskProcess = await run(TASK_RUN_TASK_IN_SEPARATE_PROCESS, {
        taskName: TASK_NODE_ZKSYNC,
        taskArgs: taskArgs
    });

    // Give the node some time to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Modify the hre object to point to the running zkSync node
    network.name = "zkSyncEraTestNode"; // or the appropriate network name

    let testFailures = 0;
    try {
        // Run the tests
        testFailures = await run(TASK_TEST_RUN_MOCHA_TESTS, {
            testFiles: files,
            parallel,
            bail,
            grep,
        });
    } finally {
        // Ensure we shut down the zkSync node after tests are done
        if (taskProcess) {
            try {
                process.kill(-taskProcess.pid!); // Notice the '-' before the pid
            } catch (e) {
                // Handle potential errors
            }
        }
    }

    process.exitCode = testFailures;
    return testFailures;
});