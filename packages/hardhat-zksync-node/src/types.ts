export interface CommandArguments {
    port?: number;
    log?: string;
    logFilePath?: string;
    cache?: string;
    cacheDir?: string;
    resetCache?: boolean;
    overrideBytecodesDir?: string;
    spawnL1?: number;
    externalL1?: string;
    showCalls?: string;
    showStorageLogs?: string;
    showVmDetails?: string;
    showGasDetails?: string;
    devSystemContracts?: string;
    fork?: string;
    forkBlockNumber?: number;
    replayTx?: string;
    showNodeConfig?: boolean;
    showTxSummary?: boolean;
    quiet?: boolean;
}

export interface ZkSyncAnvilConfig {
    version?: string;
    binaryPath?: string;
}
