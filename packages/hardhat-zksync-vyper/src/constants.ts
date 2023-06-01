import { ZkVyperConfig } from './types';

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
