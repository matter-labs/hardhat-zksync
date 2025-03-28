import { spawn } from 'child_process';
import { task, subtask, types, extendConfig } from 'hardhat/config';
import {
    TASK_COMPILE,
    TASK_NODE,
    TASK_RUN,
    TASK_TEST,
    TASK_TEST_GET_TEST_FILES,
    TASK_TEST_RUN_MOCHA_TESTS,
} from 'hardhat/builtin-tasks/task-names';

import { HARDHAT_NETWORK_NAME } from 'hardhat/plugins';
import { TaskArguments } from 'hardhat/types';
import path from 'path';
import chalk from 'chalk';
import {
    DEFAULT_ZKSYNC_ANVIL_VERSION,
    MAX_PORT_ATTEMPTS,
    START_PORT,
    TASK_NODE_ZKSYNC,
    TASK_NODE_ZKSYNC_CREATE_SERVER,
    TASK_NODE_ZKSYNC_DOWNLOAD_BINARY,
    TASK_RUN_NODE_ZKSYNC_IN_SEPARATE_PROCESS,
} from './constants';
import { JsonRpcServer, RpcServer } from './server';
import {
    adjustTaskArgsForPort,
    configureNetwork,
    constructCommandArgs,
    getAvailablePort,
    getPlatform,
    getRPCServerBinariesDir,
    waitForNodeToBeReady,
} from './utils';
import { RPCServerDownloader } from './downloader';
import { ZkSyncNodePluginError } from './errors';
import { interceptAndWrapTasksWithNode } from './core/global-interceptor';
import { runScriptWithHardhat } from './core/script-runner';
import './type-extensions';
import '@matterlabs/hardhat-zksync-telemetry';

extendConfig((config, userConfig) => {
    config.zksyncAnvil = {
        version: userConfig.zksyncAnvil?.version || DEFAULT_ZKSYNC_ANVIL_VERSION,
        binaryPath: userConfig.zksyncAnvil?.binaryPath || undefined,
    };
});

task(TASK_RUN).setAction(async (args, hre, runSuper) => {
    if (!hre.network.zksync || hre.network.name !== HARDHAT_NETWORK_NAME) {
        await runSuper(args, hre);
        return;
    }

    await runScriptWithHardhat(hre.hardhatArguments, hre.config.zksyncAnvil, path.resolve(args.script));
});

// Subtask to download the binary
subtask(TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, 'Downloads the JSON-RPC server binary')
    .addFlag('force', 'Force download even if the binary already exists')
    .addOptionalParam('tag', 'Specified node release for use', undefined)
    .setAction(
        async (
            {
                force,
                tag,
            }: {
                force: boolean;
                tag: string;
            },
            _hre,
        ) => {
            // Directory where the binaries are stored
            const rpcServerBinaryDir = await getRPCServerBinariesDir();
            const version = tag || _hre.config.zksyncAnvil.version!;
            // Get the latest release of the binary
            const downloader: RPCServerDownloader = new RPCServerDownloader(rpcServerBinaryDir, version);

            if (_hre.config.zksyncAnvil.binaryPath) {
                console.warn(
                    chalk.yellow(
                        'Binary path will have priority over the download of the binary file from the tag version',
                    ),
                );
            }
            // Download binary if needed
            await downloader.downloadIfNeeded(force, _hre.config.zksyncAnvil.binaryPath);
            return await downloader.getBinaryPath();
        },
    );

// Subtask to create the server
subtask(TASK_NODE_ZKSYNC_CREATE_SERVER, 'Creates a JSON-RPC server for ZKsync node')
    .addParam('binaryPath', 'Path to the binary file', undefined, types.string)
    .setAction(
        async (
            {
                binaryPath,
            }: {
                binaryPath: string;
            },
            _hre,
        ) => {
            // Create the server
            const server: JsonRpcServer = new JsonRpcServer(binaryPath);

            return server;
        },
    );

task(TASK_NODE, 'Start a ZKSync Node')
    .addOptionalParam('log', 'Log filter level (error, warn, info, debug) - default: info', undefined, types.string)
    .addOptionalParam(
        'logFilePath',
        'Path to the file where logs should be written - default: `anvil-zksync.log`',
        undefined,
        types.string,
    )
    .addOptionalParam('cache', 'Cache type (none, disk, memory) - default: disk', undefined, types.string)
    .addOptionalParam(
        'cacheDir',
        'Cache directory location for `disk` cache - default: `.cache`',
        undefined,
        types.string,
    )
    .addFlag('resetCache', 'Reset the local `disk` cache')
    .addOptionalParam(
        'showCalls',
        'Show call debug information (none, user, system, all) - default: none',
        undefined,
        types.string,
    )
    .addOptionalParam('showEventLogs', 'Show event logs')
    .addOptionalParam(
        'showStorageLogs',
        'Show storage log information (none, read, write, all) - default: none',
        undefined,
        types.string,
    )
    .addOptionalParam(
        'showVmDetails',
        'Show VM details information (none, all) - default: none',
        undefined,
        types.string,
    )
    .addOptionalParam(
        'showGasDetails',
        'Show Gas details information (none, all) - default: none',
        undefined,
        types.string,
    )
    .addFlag(
        'resolveHashes',
        'Try to contact openchain to resolve the ABI & topic names. It enabled, it makes debug log more readable, but will decrease the performance',
    )
    .addFlag(
        'devUseLocalContracts',
        'Loads the locally compiled system contracts (useful when doing changes to system contracts or bootloader)',
    )
    .addOptionalParam('replayTx', 'Transaction hash to replay', undefined, types.string)
    .addOptionalParam('tag', 'Specified node release for use', undefined)
    // .addOptionalParam('force', 'Force download', undefined, types.boolean)
    .setAction(async (args: TaskArguments, { network, run }, runSuper) => {
        if (network.zksync !== true || network.name !== HARDHAT_NETWORK_NAME) {
            return await runSuper();
        }

        await run(TASK_NODE_ZKSYNC, args);
    });

// Main task of the plugin. It starts the server and listens for requests.
task(TASK_NODE_ZKSYNC, 'Starts a JSON-RPC server for ZKsync node')
    .addOptionalParam('port', 'Port to listen on - default: 8011', undefined, types.int)
    .addOptionalParam('log', 'Log filter level (error, warn, info, debug) - default: info', undefined, types.string)
    .addOptionalParam(
        'logFilePath',
        'Path to the file where logs should be written - default: `anvil-zksync.log`',
        undefined,
        types.string,
    )
    .addOptionalParam('cache', 'Cache type (none, disk, memory) - default: disk', undefined, types.string)
    .addOptionalParam(
        'cacheDir',
        'Cache directory location for `disk` cache - default: `.cache`',
        undefined,
        types.string,
    )
    .addFlag('resetCache', 'Reset the local `disk` cache')
    .addOptionalParam(
        'showCalls',
        'Show call debug information (none, user, system, all) - default: none',
        undefined,
        types.string,
    )
    .addOptionalParam('showEventLogs', 'Show event logs')
    .addOptionalParam(
        'showStorageLogs',
        'Show storage log information (none, read, write, all) - default: none',
        undefined,
        types.string,
    )
    .addOptionalParam(
        'showVmDetails',
        'Show VM details information (none, all) - default: none',
        undefined,
        types.string,
    )
    .addOptionalParam(
        'showGasDetails',
        'Show Gas details information (none, all) - default: none',
        undefined,
        types.string,
    )
    .addFlag(
        'resolveHashes',
        'Try to contact openchain to resolve the ABI & topic names. It enabled, it makes debug log more readable, but will decrease the performance',
    )
    .addFlag(
        'devUseLocalContracts',
        'Loads the locally compiled system contracts (useful when doing changes to system contracts or bootloader)',
    )
    .addOptionalParam(
        'fork',
        'Starts a local network that is a fork of another network (testnet, mainnet, http://XXX:YY)',
        undefined,
        types.string,
    )
    .addOptionalParam('forkBlockNumber', 'Fork at the specified block height', undefined, types.int)
    .addOptionalParam('replayTx', 'Transaction hash to replay', undefined, types.string)
    .addOptionalParam('tag', 'Specified node release for use', undefined)
    .addFlag('quite', 'Disables logs')
    .addFlag('force', 'Force download even if the binary already exists')
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
                showEventLogs,
                showStorageLogs,
                showVmDetails,
                showGasDetails,
                resolveHashes,
                devUseLocalContracts,
                fork,
                forkBlockNumber,
                replayTx,
                tag,
                quiet,
                force,
            }: {
                port: number;
                log: string;
                logFilePath: string;
                cache: string;
                cacheDir: string;
                resetCache: boolean;
                showCalls: string;
                showEventLogs: boolean;
                showStorageLogs: string;
                showVmDetails: string;
                showGasDetails: string;
                resolveHashes: boolean;
                devUseLocalContracts: boolean;
                fork: string;
                forkBlockNumber: number;
                replayTx: string;
                tag: string;
                quiet: boolean;
                force: boolean;
            },
            { run },
        ) => {
            const commandArgs = constructCommandArgs({
                port,
                log,
                logFilePath,
                cache,
                cacheDir,
                resetCache,
                showCalls,
                showEventLogs,
                showStorageLogs,
                showVmDetails,
                showGasDetails,
                resolveHashes,
                devUseLocalContracts,
                fork,
                forkBlockNumber,
                replayTx,
                quiet,
            });

            const binaryPath: string = await run(TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, { force, tag });

            // Create the server
            const server: RpcServer = await run(TASK_NODE_ZKSYNC_CREATE_SERVER, { binaryPath });

            try {
                await server.listen(commandArgs);
            } catch (error: any) {
                throw new ZkSyncNodePluginError(`Failed when running node: ${error.message}`);
            }
        },
    );

subtask(TASK_RUN_NODE_ZKSYNC_IN_SEPARATE_PROCESS, 'Runs a Hardhat node-zksync task in a separate process.')
    .addVariadicPositionalParam('taskArgs', 'Arguments for the Hardhat node-zksync task.')
    .setAction(async ({ taskArgs = [] }, _hre) => {
        const currentPort = await getAvailablePort(START_PORT, MAX_PORT_ATTEMPTS);
        const adjustedArgs = adjustTaskArgsForPort(taskArgs, currentPort);

        const taskProcess = spawn('npx', ['hardhat', TASK_NODE_ZKSYNC, ...adjustedArgs], {
            detached: true, // This creates a separate process group
            // stdio: 'inherit',
        });

        return {
            process: taskProcess,
            port: currentPort,
        };
    });

task(
    TASK_TEST,
    async (
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
        { run, network, config },
        runSuper,
    ) => {
        if (network.zksync !== true || network.name !== HARDHAT_NETWORK_NAME) {
            return await runSuper();
        }

        const platform = getPlatform();
        if (platform === 'windows' || platform === '') {
            throw new ZkSyncNodePluginError(`Unsupported platform: ${platform}`);
        }

        if (!noCompile) {
            await run(TASK_COMPILE, { quiet: true });
        }

        const files = await run(TASK_TEST_GET_TEST_FILES, { testFiles });

        const binaryPath: string = await run(TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, { force: false });

        const currentPort = await getAvailablePort(START_PORT, MAX_PORT_ATTEMPTS);
        const commandArgs = constructCommandArgs({ port: currentPort, quiet: true });

        const server = new JsonRpcServer(binaryPath);

        try {
            await server.listen(commandArgs, false);

            await waitForNodeToBeReady(currentPort);
            await configureNetwork(config, network, currentPort);

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
                await server.stop();
            }

            process.exitCode = testFailures;
            return testFailures;
        } catch (error: any) {
            throw new ZkSyncNodePluginError(`Failed when running node: ${error.message}`);
        }
    },
);

interceptAndWrapTasksWithNode();
