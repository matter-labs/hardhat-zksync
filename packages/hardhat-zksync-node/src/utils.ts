import path from 'path';

import { 
    ALLOWED_CACHE_VALUES, 
    ALLOWED_FORK_VALUES, 
    ALLOWED_LOG_VALUES, 
    ALLOWED_SHOW_GAS_DETAILS_VALUES, 
    ALLOWED_SHOW_STORAGE_LOGS_VALUES, 
    ALLOWED_SHOW_VM_DETAILS_VALUES, 
    PLATFORM_MAP,
    TOOLCHAIN_MAP
} from "./constants";
import { ZkSyncNodePluginError } from "./errors";
import { CommandArguments } from "./types";

import { getCompilersDir } from 'hardhat/internal/util/global-dir';

export function constructCommandArgs(args: CommandArguments): string[] {
    const commandArgs: string[] = [];

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

    if (args.fork) {
        if (!ALLOWED_FORK_VALUES.includes(args.fork)) {
            throw new ZkSyncNodePluginError(`Invalid fork value: ${args.fork}`);
        }
        commandArgs.push(`--fork=${args.fork}`);
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
        commandArgs.push(`--show-calls`);
    }

    if (args.resolveHashes) {
        commandArgs.push(`--resolve-hashes`);
    }

    commandArgs.push('run');

    return commandArgs;
}

function getPlatform() {
    return PLATFORM_MAP[process.platform];
}

function getToolchain() {
    return TOOLCHAIN_MAP[process.platform];
}

function getArch() {
    return process.arch === 'x64' ? 'amd64' : process.arch;
}

function getExtension() {
    return process.platform === 'win32' ? '.exe' : '';
}

// TODO: This will be (probably) changed once there are binaries stored on GitHub. And than we can use it.
export function getRPCServerBinaryURL(repo: string, version: string, isRelease: boolean = true): string {
    const platform = getPlatform();
    const toolchain = getToolchain();
    const arch = getArch();
    const ext = getExtension();

    const commonPath = `era-test-node-${platform}-${arch}${toolchain}-v${version}${ext}`;
    return isRelease 
        ? `${repo}/releases/download/v${version}/${commonPath}`
        : `${repo}/raw/main/${platform}-${arch}/${commonPath}`;
}

export async function getRPCServerBinariesDir(): Promise<string> {
    const compilersCachePath = await getCompilersDir();
    const basePath = path.dirname(compilersCachePath);
    const rpcServerBinariesPath = path.join(basePath, 'zksync-memory-node');

    return rpcServerBinariesPath;
}
