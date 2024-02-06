import { DeployerAccount } from "./types";

export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-deploy';
export const ETH_DEFAULT_NETWORK_RPC_URL = 'http://localhost:8545';

export const LOCAL_CHAIN_IDS = [
    '0x104', // era-node
    '0x10e', // local-setup
];

export const DEFAULT_DEPLOY_SCRIPTS_PATH = 'deploy';

export const defaultAccountDeployerSettings: DeployerAccount = {
    "default": 0
};

