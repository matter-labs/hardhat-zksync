import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';
import { ETH_NETWORK_RPC_URL, ZKSYNC_NETWORK_NAME, ZKSYNC_NETWORK_RPC_URL } from '../../constants';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.5.15',
        settings: {},
    },
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
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
