import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    defaultNetwork: 'zkSyncNetwork',
    networks: {
        hardhat: {
            zksync: false,
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
