import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';
import { ETH_NETWORK_RPC_URL, ZKSYNC_NETWORK_NAME, ZKSYNC_NETWORK_RPC_URL } from '../../constants';

const config: HardhatUserConfig = {
    defaultNetwork: 'zkSyncNetwork',
    networks: {
        hardhat: {
            zksync: true,
        },
        sepolia: {
            url: ETH_NETWORK_RPC_URL,
        },
        [ZKSYNC_NETWORK_NAME]: {
            url: ZKSYNC_NETWORK_RPC_URL,
            ethNetwork: 'sepolia',
            zksync: true,
        },
        zkSyncNetwork: {
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            zksync: true,
            forceDeploy: true,
        },
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
    },
};

export default config;
