export interface CommandArguments {
    port?: number;
    log?: string;
    logFilePath?: string;
    cache?: string;
    cacheDir?: string;
    resetCache?: boolean;
    showCalls?: string;
    showStorageLogs?: string;
    showVmDetails?: string;
    showGasDetails?: string;
    resolveHashes?: boolean;
    devUseLocalContracts?: boolean;
    fork?: string;
    forkBlockNumber?: number;
    replayTx?: string;
}
