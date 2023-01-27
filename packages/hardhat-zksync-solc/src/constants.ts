import { ZkSolcConfig } from './types';

export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-solc';
export const ZK_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
export const ZKSOLC_BIN_REPOSITORY = 'https://github.com/matter-labs/zksolc-bin';
export const LATEST_VERSION = '1.2.1';

export const defaultZkSolcConfig: ZkSolcConfig = {
    version: LATEST_VERSION,
    compilerSource: 'binary',
    settings: {
        compilerPath: '',
        experimental: {},
    },
};

export const SUPPORTED_ZKSOLC_OUTPUT_SELECTIONS = [
    'abi',
    'evm.methodIdentifiers',
    'storageLayout',
    'irOptimized',
    'evm.legacyAssembly',
    'ast',
];
