import { ZkVyperConfig } from './types';

export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-vyper';
export const SOLIDITY_EXTENSION = '.sol';
export const ZKVYPER_BIN_REPOSITORY = 'https://github.com/matter-labs/zkvyper-bin';
export const ZKVYPER_BIN_VERSION_INFO = `https://raw.githubusercontent.com/matter-labs/zkvyper-bin/main`;

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

export const DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours

export const COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR = 'Could not find zkvyper compiler version info file. Please check your internet connection and try again.';
export const COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR = 'Could not download zkvyper compiler version info file. Please check your internet connection and try again.';

export const COMPILER_VERSION_RANGE_ERROR = (version: string, minVersion: string, latestVersion: string) => `Invalid zkvyper compiler version ${version}. Valid versions are ${minVersion} to ${latestVersion}`;
export const COMPILER_VERSION_WARNING = (version: string, latestVersion: string) => `zkvyper compiler version ${version} is not the latest. We recommend using the latest version ${latestVersion}.`;
export const COMPILER_BINARY_CORRUPTION_ERROR = (compilerPath: string) => `The zkvyper binary at path ${compilerPath} is corrupted. Please delete it and try again.`;

