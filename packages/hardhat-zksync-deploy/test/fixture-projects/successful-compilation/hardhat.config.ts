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
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork2: {
            url: 'http://0.0.0.0:8011',
            ethNetwork: 'ethNetwork',
            zksync: true,
            accounts: ['0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110'],
        },
    },
};

export default config;
