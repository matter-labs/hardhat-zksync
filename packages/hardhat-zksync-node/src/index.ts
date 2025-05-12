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
import { JsonRpcServer } from './server';
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
    // Network Options
    .addOptionalParam('chainId', 'Chain ID to use - default: 260', undefined, types.int)
    // Logging Options
    .addOptionalParam('log', 'Log filter level (error, warn, info, debug) - default: info', undefined, types.string)
    .addOptionalParam(
        'logFilePath',
        'Path to the file where logs should be written - default: `anvil-zksync.log`',
        undefined,
        types.string,
    )
    .addFlag('silent', 'Disables logs')
    // Options
    .addOptionalParam('timestamp', 'Override genesis timestamp', undefined, types.bigint)
    .addOptionalParam(
        'init',
        ' Initialize the genesis block with the given `genesis.json` file',
        undefined,
        types.string,
    )
    .addOptionalParam('state', 'Load + dump snapshot on exit', undefined, types.string)
    .addOptionalParam('stateInterval', 'Interval to dump state', undefined, types.bigint)
    .addFlag('preserveHistoricalStates', 'Preserve historical states')
    .addOptionalParam('order', 'Transaction ordering in the mempool - default: fifo', undefined, types.string)
    .addFlag('noMining', 'Mine blocks only when RPC clients call evm_mine')
    .addFlag('anvilZksyncVersion', 'Print version and exit')
    .addFlag('anvilZksyncHelp', 'Print help and exit')
    // General Options
    .addFlag('offline', 'Run in offline mode')
    .addFlag('healthCheckEndpoint', 'Enable health check endpoint')
    .addOptionalParam(
        'configOut',
        'Writes output of `anvil-zksync` as json to user-specified file',
        undefined,
        types.string,
    )
    // L1 Options
    .addOptionalParam('spawnL1', 'Launch an Anvil L1 node on a specified port', undefined, types.int)
    .addOptionalParam('externalL1', 'Use an external L1 node', undefined, types.string)
    .addFlag('noRequestSizeLimit', 'Disable request size limit')
    .addFlag('autoExecuteL1', 'Auto-execute L1 batches after L2 sealing')
    // Block Options
    .addOptionalParam('blockTime', 'Seal blocks at a fixed interval', undefined, types.bigint)
    // Accounts Options
    .addOptionalParam('accounts', 'Pre-funded dev accounts', undefined, types.bigint)
    .addOptionalParam('balance', 'Pre-funded dev accounts balance', undefined, types.bigint)
    .addFlag('autoImpersonate', 'Auto-impersonate accounts')
    // Cache Options
    .addOptionalParam('cache', 'Cache type (none, disk, memory) - default: disk', undefined, types.string)
    .addOptionalParam(
        'cacheDir',
        'Cache directory location for `disk` cache - default: `.cache`',
        undefined,
        types.string,
    )
    .addFlag('resetCache', 'Reset the local `disk` cache')
    // Debugging Options
    .addOptionalParam('verbosity', 'Verbosity level traces (vv, vvv)', undefined, types.string)
    .addFlag('showNodeConfig', 'Show node configuration')
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
    // Gas configuration
    .addOptionalParam('l1GasPrice', 'L1 gas price', undefined, types.bigint)
    .addOptionalParam('l2GasPrice', 'L2 gas price', undefined, types.bigint)
    .addOptionalParam('l1PubDataPrice', 'L1 pub data price', undefined, types.bigint)
    .addOptionalParam('priceScaleFactor', 'Gas price estimation scale factor', undefined, types.bigint)
    .addOptionalParam('limitScaleFactor', 'Gas limit estimation scale factor', undefined, types.bigint)
    // System Configuration
    .addOptionalParam('overrideBytecodesDir', 'Override the bytecodes directory', undefined, types.string)
    .addOptionalParam(
        'devSystemContracts',
        'Option for system contracts (built-in, local, built-in-without-security) default: built-in',
        undefined,
        types.string,
    )
    .addFlag('enforceBytecodeCompression', 'Enforce bytecode compression')
    .addOptionalParam('systemContractsPath', 'Path to the system contracts', undefined, types.string)
    .addOptionalParam('protocolVersion', 'Protocol version to use for new blocks (default: 26)', undefined, types.int)
    .addFlag('emulateEvm', 'Emulate EVM')
    // Logging Options
    .addFlag('quite', 'Disables logs')
    // Server Options
    .addFlag('noCors', 'Disable CORS')
    .addOptionalParam('allowOrigin', 'Allow origin', undefined, types.string)
    // Custom base token configuration
    .addOptionalParam('baseTokenSymbol', 'Custom base token symbol', undefined, types.string)
    .addOptionalParam('baseTokenRatio', 'Custom base token ratio', undefined, types.string)
    // Plugin specific configuration
    .addFlag('force', 'Force download even if the binary already exists')
    .addOptionalParam('tag', 'Specified node release for use', undefined)
    .setAction(async (args: TaskArguments, { network, run }, runSuper) => {
        if (network.zksync !== true || network.name !== HARDHAT_NETWORK_NAME) {
            return await runSuper();
        }

        await run(TASK_NODE_ZKSYNC, args);
    });

// Main task of the plugin. It starts the server and listens for requests.
task(TASK_NODE_ZKSYNC, 'Starts a JSON-RPC server for ZKsync node')
    // Network Options
    .addOptionalParam('port', 'Port to listen on - default: 8011', undefined, types.int)
    .addOptionalParam('host', 'Host to listen on - default: 0.0.0.0', undefined, types.string)
    .addOptionalParam('chainId', 'Chain ID to use - default: 260', undefined, types.int)
    // Options
    .addOptionalParam('timestamp', 'Override genesis timestamp', undefined, types.bigint)
    .addOptionalParam(
        'init',
        ' Initialize the genesis block with the given `genesis.json` file',
        undefined,
        types.string,
    )
    .addOptionalParam('state', 'Load + dump snapshot on exit', undefined, types.string)
    .addOptionalParam('stateInterval', 'Interval to dump state', undefined, types.bigint)
    .addFlag('preserveHistoricalStates', 'Preserve historical states')
    .addOptionalParam('order', 'Transaction ordering in the mempool - default: fifo', undefined, types.string)
    .addFlag('noMining', 'Mine blocks only when RPC clients call evm_mine')
    .addFlag('anvilZksyncVersion', 'Print version and exit')
    .addFlag('anvilZksyncHelp', 'Print help and exit')
    // General Options
    .addFlag('offline', 'Run in offline mode')
    .addFlag('healthCheckEndpoint', 'Enable health check endpoint')
    .addOptionalParam(
        'configOut',
        'Writes output of `anvil-zksync` as json to user-specified file',
        undefined,
        types.string,
    )
    // L1 Options
    .addOptionalParam('spawnL1', 'Launch an Anvil L1 node on a specified port', undefined, types.int)
    .addOptionalParam('externalL1', 'Use an external L1 node', undefined, types.string)
    .addFlag('noRequestSizeLimit', 'Disable request size limit')
    .addFlag('autoExecuteL1', 'Auto-execute L1 batches after L2 sealing')
    // Block Options
    .addOptionalParam('blockTime', 'Seal blocks at a fixed interval', undefined, types.bigint)
    // Accounts Options
    .addOptionalParam('accounts', 'Pre-funded dev accounts', undefined, types.bigint)
    .addOptionalParam('balance', 'Pre-funded dev accounts balance', undefined, types.bigint)
    .addFlag('autoImpersonate', 'Auto-impersonate accounts')
    // Cache Options
    .addOptionalParam('cache', 'Cache type (none, disk, memory) - default: disk', undefined, types.string)
    .addOptionalParam(
        'cacheDir',
        'Cache directory location for `disk` cache - default: `.cache`',
        undefined,
        types.string,
    )
    .addFlag('resetCache', 'Reset the local `disk` cache')
    // Debugging Options
    .addOptionalParam('verbosity', 'Verbosity level traces (vv, vvv)', undefined, types.string)
    .addFlag('showNodeConfig', 'Show node configuration')
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
    // Gas configuration
    .addOptionalParam('l1GasPrice', 'L1 gas price', undefined, types.bigint)
    .addOptionalParam('l2GasPrice', 'L2 gas price', undefined, types.bigint)
    .addOptionalParam('l1PubdataPrice', 'L1 pub data price', undefined, types.bigint)
    .addOptionalParam('priceScaleFactor', 'Gas price estimation scale factor', undefined, types.bigint)
    .addOptionalParam('limitScaleFactor', 'Gas limit estimation scale factor', undefined, types.bigint)
    // System Configuration
    .addOptionalParam('overrideBytecodesDir', 'Override the bytecodes directory', undefined, types.string)
    .addOptionalParam(
        'devSystemContracts',
        'Option for system contracts (built-in, local, built-in-without-security) default: built-in',
        undefined,
        types.string,
    )
    .addFlag('enforceBytecodeCompression', 'Enforce bytecode compression')
    .addOptionalParam('systemContractsPath', 'Path to the system contracts', undefined, types.string)
    .addOptionalParam('protocolVersion', 'Protocol version to use for new blocks (default: 26)', undefined, types.int)
    .addFlag('emulateEvm', 'Emulate EVM')
    // Fork Configuration
    .addOptionalParam(
        'fork',
        'Starts a local network that is a fork of another network (testnet, mainnet, http://XXX:YY)',
        undefined,
        types.string,
    )
    .addOptionalParam('forkBlockNumber', 'Fork at the specified block height', undefined, types.int)
    .addOptionalParam('replayTx', 'Transaction hash to replay', undefined, types.string)
    // Logging Options
    .addFlag('quite', 'Disables logs')
    .addOptionalParam(
        'log',
        'Log filter level (trace, debug, info, warn, error, none) - default: info',
        undefined,
        types.string,
    )
    .addOptionalParam(
        'logFilePath',
        'Path to the file where logs should be written - default: `anvil-zksync.log`',
        undefined,
        types.string,
    )
    .addFlag('silent', 'Disables logs')
    // Server Options
    .addFlag('noCors', 'Disable CORS')
    .addOptionalParam('allowOrigin', 'Allow origin', undefined, types.string)
    // Custom base token configuration
    .addOptionalParam('baseTokenSymbol', 'Custom base token symbol', undefined, types.string)
    .addOptionalParam('baseTokenRatio', 'Custom base token ratio', undefined, types.string)
    // Plugin specific configuration
    .addOptionalParam('tag', 'Specified node release for use', undefined)
    .addFlag('force', 'Force download even if the binary already exists')
    .setAction(
        async (
            {
                port,
                host,
                chainId,
                log,
                logFilePath,
                timestamp,
                init,
                state,
                stateInterval,
                preserveHistoricalStates,
                order,
                noMining,
                anvilZksyncVersion,
                anvilZksyncHelp,
                offline,
                healthCheckEndpoint,
                configOut,
                spawnL1,
                externalL1,
                noRequestSizeLimit,
                autoExecuteL1,
                blockTime,
                accounts,
                balance,
                autoImpersonate,
                l1GasPrice,
                l2GasPrice,
                l1PubdataPrice,
                baseTokenSymbol,
                baseTokenRatio,
                priceScaleFactor,
                limitScaleFactor,
                allowOrigin,
                noCors,
                cache,
                cacheDir,
                resetCache,
                verbosity,
                showNodeConfig,
                showStorageLogs,
                showVmDetails,
                showGasDetails,
                devSystemContracts,
                enforceBytecodeCompression,
                systemContractsPath,
                protocolVersion,
                emulateEvm,
                fork,
                forkBlockNumber,
                replayTx,
                tag,
                quiet,
                force,
            }: {
                port?: number;
                host?: string;
                chainId?: number;
                log?: string;
                logFilePath?: string;
                timestamp?: bigint;
                init?: string;
                state?: string;
                stateInterval?: bigint;
                preserveHistoricalStates?: boolean;
                order?: string;
                noMining?: boolean;
                anvilZksyncVersion?: boolean;
                anvilZksyncHelp?: boolean;
                offline?: boolean;
                healthCheckEndpoint?: boolean;
                configOut?: string;
                spawnL1?: number;
                externalL1?: string;
                noRequestSizeLimit?: boolean;
                autoExecuteL1?: boolean;
                blockTime?: bigint;
                accounts?: bigint;
                balance?: bigint;
                autoImpersonate?: boolean;
                l1GasPrice?: bigint;
                l2GasPrice?: bigint;
                l1PubdataPrice?: bigint;
                priceScaleFactor?: bigint;
                limitScaleFactor?: bigint;
                baseTokenSymbol?: string;
                baseTokenRatio?: string;
                allowOrigin?: string;
                noCors?: boolean;
                cache?: string;
                cacheDir?: string;
                resetCache?: boolean;
                verbosity?: string;
                showNodeConfig?: boolean;
                showStorageLogs?: string;
                showVmDetails?: string;
                showGasDetails?: string;
                devSystemContracts?: string;
                enforceBytecodeCompression?: boolean;
                systemContractsPath?: string;
                protocolVersion?: number;
                emulateEvm?: boolean;
                fork?: string;
                forkBlockNumber?: number;
                replayTx?: string;
                tag?: string;
                quiet?: boolean;
                force?: boolean;
            },
            { run },
        ) => {
            const commandArgs = constructCommandArgs({
                port,
                host,
                chainId,
                log,
                logFilePath,
                timestamp,
                init,
                state,
                stateInterval,
                preserveHistoricalStates,
                order,
                noMining,
                anvilZksyncVersion,
                anvilZksyncHelp,
                offline,
                healthCheckEndpoint,
                configOut,
                spawnL1,
                externalL1,
                noRequestSizeLimit,
                autoExecuteL1,
                blockTime,
                accounts,
                balance,
                autoImpersonate,
                l1GasPrice,
                l2GasPrice,
                l1PubdataPrice,
                priceScaleFactor,
                limitScaleFactor,
                baseTokenSymbol,
                baseTokenRatio,
                allowOrigin,
                noCors,
                cache,
                cacheDir,
                resetCache,
                verbosity,
                showNodeConfig,
                showStorageLogs,
                showVmDetails,
                showGasDetails,
                devSystemContracts,
                enforceBytecodeCompression,
                systemContractsPath,
                protocolVersion,
                emulateEvm,
                fork,
                forkBlockNumber,
                replayTx,
                quiet,
                force,
                tag,
            });

            const binaryPath = await run(TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, { force, tag });

            // Create the server
            const server = await run(TASK_NODE_ZKSYNC_CREATE_SERVER, { binaryPath });

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
