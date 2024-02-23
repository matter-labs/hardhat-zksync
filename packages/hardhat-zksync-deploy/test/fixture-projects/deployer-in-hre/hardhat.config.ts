import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';
import { ETH_NETWORK_RPC_URL, ZKSYNC_NETWORK_NAME, ZKSYNC_NETWORK_RPC_URL } from '../../constants';

import '@matterlabs/hardhat-zksync-solc';

const config: HardhatUserConfig = {
    zksolc: {},
    solidity: {
        version: '0.8.17',
    },
    defaultNetwork: 'zkSyncNetwork2',
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
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            zksync: true,
            forceDeploy: true,
        },
    },
};

export default config;
