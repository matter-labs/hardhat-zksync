export interface CommandArguments {
    // Network Options
    port?: number;
    host?: string;
    chainId?: number;
    // Logging Options
    log?: string;
    logFilePath?: string;
    silent?: boolean;
    // Options
    timestamp?: bigint;
    init?: string;
    state?: string;
    stateInterval?: bigint;
    preserveHistoricalStates?: boolean;
    order?: string;
    noMining?: boolean;
    anvilZksyncVersion?: boolean;
    anvilZksyncHelp?: boolean;
    // General Options
    offline?: boolean;
    healthCheckEndpoint?: boolean;
    configOut?: string;
    // L1 Options
    spawnL1?: number;
    externalL1?: string;
    noRequestSizeLimit?: boolean;
    autoExecuteL1?: boolean;
    // Block Options
    blockTime?: bigint;
    // Accounts Options
    accounts?: bigint;
    balance?: bigint;
    autoImpersonate?: boolean;
    // Cache Options
    cache?: string;
    cacheDir?: string;
    resetCache?: boolean;
    // Debugging Options
    verbosity?: string;
    showNodeConfig?: boolean;
    showStorageLogs?: string;
    showVmDetails?: string;
    showGasDetails?: string;
    // Gas configuration
    l1GasPrice?: bigint;
    l2GasPrice?: bigint;
    l1PubdataPrice?: bigint;
    priceScaleFactor?: bigint;
    limitScaleFactor?: bigint;
    // System Configuration
    devSystemContracts?: string;
    overrideBytecodesDir?: string;
    protocolVersion?: number;
    emulateEvm?: boolean;
    enforceBytecodeCompression?: boolean;
    systemContractsPath?: string;
    // Fork Configuration
    fork?: string;
    forkBlockNumber?: number;
    replayTx?: string;
    // Server Options
    noCors?: boolean;
    allowOrigin?: string;
    // Custom base token configuration
    baseTokenSymbol?: string;
    baseTokenRatio?: string;
    // Plugin specific configuration
    tag?: string;
    force?: boolean;
    quiet?: boolean;
}

export interface ZkSyncAnvilConfig {
    version?: string;
    binaryPath?: string;
}
