export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-ethers';

export const LOCAL_CHAIN_IDS = [
    '0x104', // era-node
    '0x10e', // local-setup
];

export const ZKSOLC_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
export const ZKVYPER_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';

export const ETH_DEFAULT_NETWORK_RPC_URL = 'http://0.0.0.0:8545';

export const SUPPORTED_L1_TESTNETS = ['mainnet', 'rinkeby', 'ropsten', 'kovan', 'goerli', 'sepolia'];

export const LIBRARIES_NOT_EXIST_ON_NETWORK_ERROR =
    'Some libraries are not deployed on the network and have been removed from the Hardhat configuration. Please run the compile, then try again with the deployment process.';
