import { ZkVyperConfig } from './types';

export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-vyper';
export const SOLIDITY_EXTENSION = '.sol';
export const LATEST_VERSION = '1.3.4';

export const defaultZkVyperConfig: ZkVyperConfig = {
    version: LATEST_VERSION,
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
