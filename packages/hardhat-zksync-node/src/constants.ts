export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-node';

export const ZKNODE_BIN_OWNER = 'matter-labs';
export const ZKNODE_BIN_REPOSITORY_NAME = 'anvil-zksync';
export const ZKNODE_BIN_REPOSITORY = 'https://github.com/matter-labs/anvil-zksync';
// User agent of MacOSX Chrome 120.0.0.0
export const USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const TASK_NODE_ZKSYNC = 'node-zksync';
export const TASK_NODE_ZKSYNC_CREATE_SERVER = 'node-zksync:create-server';
export const TASK_NODE_ZKSYNC_DOWNLOAD_BINARY = 'node-zksync:download-binary';
export const TASK_RUN_NODE_ZKSYNC_IN_SEPARATE_PROCESS = 'node-zksync:run-in-separate-process';

export const PROCESS_TERMINATION_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGKILL'];

export const ALLOWED_LOG_VALUES = ['error', 'warn', 'info', 'debug'];
export const ALLOWED_CACHE_VALUES = ['none', 'disk', 'memory'];
export const ALLOWED_SHOW_STORAGE_LOGS_VALUES = ['none', 'read', 'write', 'all'];
export const ALLOWED_SHOW_VM_DETAILS_VALUES = ['none', 'all'];
export const ALLOWED_SHOW_GAS_DETAILS_VALUES = ['none', 'all'];

export const DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
export const DEFAULT_RELEASE_CACHE_FILE_NAME = 'list.json';
export const ERA_TEST_NODE_BINARY_VERSION = '0.1.0';
export const PLATFORM_MAP: Record<string, string> = {
    darwin: 'apple-darwin',
    linux: 'unknown-linux-gnu',
    win32: 'windows',
};

export const TEMP_FILE_PREFIX = 'tmp-';

export const START_PORT = 8011;
export const MAX_PORT_ATTEMPTS = 10;
export const PORT_CHECK_DELAY = 500;
export const RPC_ENDPOINT_PATH = 'eth_chainId';

export const ZKSYNC_ERA_TEST_NODE_NETWORK_NAME = 'AnvilZKsync';
export const BASE_URL = `http://127.0.0.1`;
export const NETWORK_ACCOUNTS = {
    REMOTE: 'remote',
};
export const NETWORK_GAS = {
    AUTO: 'auto',
};
export const NETWORK_GAS_PRICE = {
    AUTO: 'auto',
};
export const NETWORK_ETH = {
    LOCALHOST: 'localhost',
};

export const DEFAULT_ZKSYNC_ANVIL_VERSION = '0.6.*';

export const DEFAULT_TIMEOUT_MILISECONDS = 30000;

// export const TOOLCHAIN_MAP: Record<string, string> = {
//     linux: '-musl',
//     win32: '-gnu',
//     darwin: '',
// };
