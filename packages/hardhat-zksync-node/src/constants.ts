export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-node';

export const ZKNODE_BIN_OWNER = 'matter-labs';
export const ZKNODE_BIN_REPOSITORY_NAME = 'era-test-node';

export const TASK_NODE_ZKSYNC = 'node-zksync';
export const TASK_NODE_ZKSYNC_CREATE_SERVER = 'node-zksync:create-server';
export const TASK_NODE_ZKSYNC_DOWNLOAD_BINARY = 'node-zksync:download-binary';

export const PROCESS_TERMINATION_SIGNALS = ['SIGINT', 'SIGTERM'];

export const ALLOWED_LOG_VALUES = ['error', 'warn', 'info', 'debug'];
export const ALLOWED_CACHE_VALUES = ['none', 'disk', 'memory'];
export const ALLOWED_FORK_VALUES = ['testnet', 'mainnet'];
export const ALLOWED_SHOW_STORAGE_LOGS_VALUES = ['none', 'read', 'write', 'all'];
export const ALLOWED_SHOW_VM_DETAILS_VALUES = ['none', 'all'];
export const ALLOWED_SHOW_GAS_DETAILS_VALUES = ['none', 'all'];

export const PLATFORM_MAP: Record<string, string> = {
    darwin: 'apple-darwin',
    linux: 'unknown-linux-gnu',
    win32: 'windows',
};

export const TEMP_FILE_PREFIX = 'tmp-';

// export const TOOLCHAIN_MAP: Record<string, string> = {
//     linux: '-musl',
//     win32: '-gnu',
//     darwin: '',
// };
