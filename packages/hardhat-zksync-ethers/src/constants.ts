export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-ethers';

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum LOCAL_CHAIN_IDS_ENUM {
    ERA_NODE = '0x104', // era-node
    LOCAL_SETUP = '0x10e', // local-setup
}

export const LOCAL_CHAIN_IDS = [LOCAL_CHAIN_IDS_ENUM.ERA_NODE, LOCAL_CHAIN_IDS_ENUM.LOCAL_SETUP];

export const LOCAL_CHAINS_WITH_IMPERSONATION = [LOCAL_CHAIN_IDS_ENUM.ERA_NODE];

export const ZKSOLC_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
export const ZKVYPER_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';

export const ETH_DEFAULT_NETWORK_RPC_URL = 'http://0.0.0.0:8545';

export const SUPPORTED_L1_TESTNETS = ['mainnet', 'rinkeby', 'ropsten', 'kovan', 'goerli', 'sepolia'];
