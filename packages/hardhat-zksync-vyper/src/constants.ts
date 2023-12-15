import { ZkVyperConfig } from './types';

export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-vyper';
export const SOLIDITY_EXTENSION = '.sol';
export const ZKVYPER_BIN_REPOSITORY = 'https://github.com/matter-labs/zkvyper-bin';
export const DEFAULT_TIMEOUT_MILISECONDS = 30000;
export const TASK_COMPILE_VYPER_CHECK_ERRORS = 'compile:vyper:check-errors';
export const TASK_COMPILE_VYPER_LOG_COMPILATION_ERRORS = 'compile:vyper:log:compilation-errors';

// User agent of MacOSX Chrome 120.0.0.0
export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const defaultZkVyperConfig: ZkVyperConfig = {
    version: 'latest',
    compilerSource: 'binary',
    settings: {
        optimizer: {
            mode: '3',
        },
        compilerPath: '',
        experimental: {},
    },
};

export const UNSUPPORTED_VYPER_VERSIONS = [
    '0.3.4',
    '0.3.5',
    '0.3.6',
    '0.3.7',
];

export const ZKVYPER_COMPILER_VERSION_MIN_VERSION = "1.3.9";

export const ZKVYPER_BIN_OWNER = 'matter-labs';
export const ZKVYPER_BIN_REPOSITORY_NAME = 'zkvyper-bin';

export const DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours

export const COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR = 'Could not find zkvyper compiler version info file. Please check your internet connection and try again.';
export const COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR = 'Could not download zkvyper compiler version info file. Please check your internet connection and try again.';

export const COMPILER_VERSION_RANGE_ERROR = (version: string, minVersion: string, latestVersion: string) => `The zkvyper compiler version (${version}) in the hardhat config file is not within the allowed range. Please use versions ${minVersion} to ${latestVersion}.`;
export const COMPILER_VERSION_WARNING = (version: string, latestVersion: string) => `The zkvyper compiler version in your Hardhat config file (${version}) is not the latest. We recommend using the latest version ${latestVersion}.`;
export const COMPILER_BINARY_CORRUPTION_ERROR = (compilerPath: string) => `The zkvyper binary at path ${compilerPath} is corrupted. Please delete it and try again.`;
export const COMPILING_INFO_MESSAGE = (zksolcVersion: string, solcVersion: string) => `Compiling contracts for zkSync Era with zkvyper v${zksolcVersion} and vyper v${solcVersion}`;

export const VYPER_VERSION_ERROR = 'Vyper versions 0.3.4 to 0.3.7 are not supported by zkvyper. Please use vyper 0.3.3 or >=0.3.8 in your hardhat.config file instead.'