export interface CommandArguments {
    log?: string;
    logFilePath?: string;
    cache?: string;
    cacheDir?: string;
    resetCache?: boolean;
    fork?: string;
    showStorageLogs?: string;
    showVmDetails?: string;
    showGasDetails?: string;
    showCalls?: boolean;
    resolveHashes?: boolean;
}