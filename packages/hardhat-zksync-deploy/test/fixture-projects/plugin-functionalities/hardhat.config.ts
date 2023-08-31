import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';
import { ETH_NETWORK_RPC_URL, ZKSYNC_NETWORK_NAME, ZKSYNC_NETWORK_RPC_URL } from '../../constants';

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            zksync: true,
        },
        goerli: {
            url: ETH_NETWORK_RPC_URL,
        },
        [ZKSYNC_NETWORK_NAME]: {
            url: ZKSYNC_NETWORK_RPC_URL,
            ethNetwork: 'goerli',
            zksync: true,
        },
    },
};

export default config;
