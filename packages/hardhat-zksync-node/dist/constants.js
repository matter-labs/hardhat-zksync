"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TIMEOUT_MILISECONDS = exports.NETWORK_ETH = exports.NETWORK_GAS_PRICE = exports.NETWORK_GAS = exports.NETWORK_ACCOUNTS = exports.BASE_URL = exports.ZKSYNC_ERA_TEST_NODE_NETWORK_NAME = exports.RPC_ENDPOINT_PATH = exports.PORT_CHECK_DELAY = exports.MAX_PORT_ATTEMPTS = exports.START_PORT = exports.TEMP_FILE_PREFIX = exports.PLATFORM_MAP = exports.DEFAULT_RELEASE_CACHE_FILE_NAME = exports.DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD = exports.ALLOWED_SHOW_GAS_DETAILS_VALUES = exports.ALLOWED_SHOW_VM_DETAILS_VALUES = exports.ALLOWED_SHOW_STORAGE_LOGS_VALUES = exports.ALLOWED_SHOW_CALLS_VALUES = exports.ALLOWED_FORK_VALUES = exports.ALLOWED_CACHE_VALUES = exports.ALLOWED_LOG_VALUES = exports.PROCESS_TERMINATION_SIGNALS = exports.TASK_RUN_NODE_ZKSYNC_IN_SEPARATE_PROCESS = exports.TASK_NODE_ZKSYNC_DOWNLOAD_BINARY = exports.TASK_NODE_ZKSYNC_CREATE_SERVER = exports.TASK_NODE_ZKSYNC = exports.USER_AGENT = exports.ZKNODE_BIN_REPOSITORY = exports.ZKNODE_BIN_REPOSITORY_NAME = exports.ZKNODE_BIN_OWNER = exports.PLUGIN_NAME = void 0;
exports.PLUGIN_NAME = '@matterlabs/hardhat-zksync-node';
exports.ZKNODE_BIN_OWNER = 'matter-labs';
exports.ZKNODE_BIN_REPOSITORY_NAME = 'era-test-node';
exports.ZKNODE_BIN_REPOSITORY = 'https://github.com/matter-labs/era-test-node';
// User agent of MacOSX Chrome 120.0.0.0
exports.USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
exports.TASK_NODE_ZKSYNC = 'node-zksync';
exports.TASK_NODE_ZKSYNC_CREATE_SERVER = 'node-zksync:create-server';
exports.TASK_NODE_ZKSYNC_DOWNLOAD_BINARY = 'node-zksync:download-binary';
exports.TASK_RUN_NODE_ZKSYNC_IN_SEPARATE_PROCESS = 'node-zksync:run-in-separate-process';
exports.PROCESS_TERMINATION_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGKILL'];
exports.ALLOWED_LOG_VALUES = ['error', 'warn', 'info', 'debug'];
exports.ALLOWED_CACHE_VALUES = ['none', 'disk', 'memory'];
exports.ALLOWED_FORK_VALUES = ['testnet', 'mainnet'];
exports.ALLOWED_SHOW_CALLS_VALUES = ['none', 'user', 'system', 'all'];
exports.ALLOWED_SHOW_STORAGE_LOGS_VALUES = ['none', 'read', 'write', 'all'];
exports.ALLOWED_SHOW_VM_DETAILS_VALUES = ['none', 'all'];
exports.ALLOWED_SHOW_GAS_DETAILS_VALUES = ['none', 'all'];
exports.DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
exports.DEFAULT_RELEASE_CACHE_FILE_NAME = 'latestRelease.json';
exports.PLATFORM_MAP = {
    darwin: 'apple-darwin',
    linux: 'unknown-linux-gnu',
    win32: 'windows',
};
exports.TEMP_FILE_PREFIX = 'tmp-';
exports.START_PORT = 8011;
exports.MAX_PORT_ATTEMPTS = 10;
exports.PORT_CHECK_DELAY = 500;
exports.RPC_ENDPOINT_PATH = 'eth_chainId';
exports.ZKSYNC_ERA_TEST_NODE_NETWORK_NAME = 'zkSyncEraTestNode';
exports.BASE_URL = `http://127.0.0.1`;
exports.NETWORK_ACCOUNTS = {
    REMOTE: 'remote',
};
exports.NETWORK_GAS = {
    AUTO: 'auto',
};
exports.NETWORK_GAS_PRICE = {
    AUTO: 'auto',
};
exports.NETWORK_ETH = {
    LOCALHOST: 'localhost',
};
exports.DEFAULT_TIMEOUT_MILISECONDS = 30000;
// export const TOOLCHAIN_MAP: Record<string, string> = {
//     linux: '-musl',
//     win32: '-gnu',
//     darwin: '',
// };
//# sourceMappingURL=constants.js.map