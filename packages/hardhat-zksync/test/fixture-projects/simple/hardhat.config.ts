import { HardhatUserConfig } from 'hardhat/config';
import '../../../src/index';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.5.15',
        settings: {
            codegen: 'yul',
        },
    },
    networks: {
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork: {
            zksync: true,
            url: 'http://0.0.0.0:8011',
            ethNetwork: 'ethNetwork',
            verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification',
        },
    },
    solidity: {
        version: '0.8.30',
    },
};

export default config;
