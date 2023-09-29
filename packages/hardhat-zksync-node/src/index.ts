import { task, subtask, types } from "hardhat/config";

import { PLUGIN_NAME, TASK_NODE_ZKSYNC, TASK_NODE_ZKSYNC_CREATE_SERVER, TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, ZKNODE_BIN_OWNER, ZKNODE_BIN_REPOSITORY_NAME } from "./constants";
import { JsonRpcServer } from "./server";
import { constructCommandArgs, getAssetToDownload, getLatestRelease, getRPCServerBinariesDir } from "./utils";
import { RPCServerDownloader } from "./downloader";
import { ZkSyncNodePluginError } from "./errors";

// Subtask to download the binary
subtask(TASK_NODE_ZKSYNC_DOWNLOAD_BINARY, "Downloads the JSON-RPC server binary")
    .addFlag(
        "force",
        "Force download even if the binary already exists"
    )
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
            if (!force && await downloader.isDownloaded()) {
                return downloader.getBinaryPath();
            }

            // Download the binary
            const assetToDownload: any = await getAssetToDownload(latestRelease);
            await downloader.download(assetToDownload.browser_download_url);

            return downloader.getBinaryPath();
        }
    );

// Subtask to create the server
subtask(TASK_NODE_ZKSYNC_CREATE_SERVER, "Creates a JSON-RPC server for zkSync node")
    .addParam(
        "binaryPath",
        "Path to the binary file",
        undefined,
        types.string
    )
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
task(TASK_NODE_ZKSYNC, "Starts a JSON-RPC server for zkSync node")
    .addOptionalParam(
        "log",
        "Logging level (error, warn, info, debug)",
        undefined,
        types.string
    )
    .addOptionalParam(
        "logFilePath",
        "Path to the file where logs should be written",
        undefined,
        types.string
    )
    .addOptionalParam(
        "cache",
        "Cache network request (none, disk, memory)",
        undefined,
        types.string
    )
    .addOptionalParam(
        "cacheDir",
        "Path to the directory where cache should be stored",
        undefined,
        types.string
    )
    .addFlag(
        "resetCache",
        "Reset cache before start",
    )
    .addOptionalParam(
        "fork",
        "Fork from the specified network (testnet, mainnet)",
        undefined,
        types.string
    )
    .addOptionalParam(
        "showSorageLogs",
        "Show storage logs (none, read, write, all)",
        undefined,
        types.string
    )
    .addOptionalParam(
        "showVmDetails",
        "Show VM details (none, all)",
        undefined,
        types.string
    )
    .addOptionalParam(
        "showGasDetails",
        "Show gas details (none, all)",
        undefined,
        types.string
    )
    .addFlag(
        "showCalls",
        "Print more detailed call traces"
    )
    .addFlag(
        "resolveHashes",
        "Ask openchain for ABI names"
    )
    .addFlag(
        "force",
        "Force download even if the binary already exists"
    )
    .setAction(
        async (
            {
                log,
                logFilePath,
                cache,
                cacheDir,
                resetCache,
                fork,
                showStorageLogs,
                showVmDetails,
                showGasDetails,
                showCalls,
                resolveHashes,
            }: {
                log: string;
                logFilePath: string;
                cache: string;
                cacheDir: string;
                resetCache: boolean;
                fork: string;
                showStorageLogs: string;
                showVmDetails: string;
                showGasDetails: string;
                showCalls: boolean;
                resolveHashes: boolean;
            },
            {
                run,
            }
        ) => {
            const commandArgs = constructCommandArgs({
                log,
                logFilePath,
                cache,
                cacheDir,
                resetCache,
                fork,
                showStorageLogs,
                showVmDetails,
                showGasDetails,
                showCalls,
                resolveHashes,
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
