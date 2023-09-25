import { task, subtask, types } from "hardhat/config";

import { TASK_NODE_ZKSYNC, TASK_NODE_ZKSYNC_CREATE_SERVER } from "./constants";
import { JsonRpcServer } from "./server";
import { constructCommandArgs, getRPCServerBinariesDir } from "./utils";
import { RPCServerBinaryDownloader } from "./downloader";

//TODO: Add more tasks

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
            hre
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

            const rpcServerBinariyPath = await getRPCServerBinariesDir();
            const downloader: RPCServerBinaryDownloader = new RPCServerBinaryDownloader(rpcServerBinariyPath);
            console.log(downloader.binaryPath);

            //TODO: Change this to the path of the binary
            const binaryPath = "/Users/milivojepopovac/TxFusion/Templates/era-test-node/target/debug/era_test_node";
            const server: JsonRpcServer = new JsonRpcServer(binaryPath);

            try {
                server.listen(commandArgs);  // Add any arguments if needed
            } catch (error: any) {
                throw error;
            }
        }
    );
