import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-chai-matchers';

import '../../../src/index';

const config: HardhatUserConfig = {
    zksolc: {
        version: 'latest',
        compilerSource: 'binary',
    },
    networks: {
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork: {
            zksync: true,
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification',
        },
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
