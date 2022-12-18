import { HardhatUserConfig } from 'hardhat/config';

import '../../../src/index';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.2.2',
        compilerSource: 'binary',
    },
    solidity: {
        version: '0.8.17',
    },
    networks: {
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork: {
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            zksync: true,
        },
    },
};

export default config;
