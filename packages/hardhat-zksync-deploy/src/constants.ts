import { DeployerAccount } from './types';

export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-deploy';
export const ETH_DEFAULT_NETWORK_RPC_URL = 'http://0.0.0.0:8545';

export const LOCAL_CHAIN_IDS = [
    '0x104', // era-node
    '0x10e', // local-setup
];

export const DEFAULT_DEPLOY_SCRIPTS_PATH = 'deploy';

export const SCRIPT_DEFAULT_PRIORITY = 0;

export const defaultAccountDeployerSettings: DeployerAccount = {
    default: 0,
};

export const ENCODED_ARAGUMENTS_NOT_FOUND_ERROR = (constructorArgsModulePath: string) =>
    `The module ${constructorArgsModulePath} doesn't export a list and does not start with "0x"\n` +
    `Please export a list of constructor arguments or a single string starting with "0x".`;

export const CONSTRUCTOR_MODULE_IMPORTING_ERROR = (
    errorMessage: string,
) => `Importing the module for the constructor arguments list failed.
Reason: ${errorMessage}`;
