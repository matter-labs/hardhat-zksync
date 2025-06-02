import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '../../../src/index';

import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.5.15',
        compilerSource: 'binary',
        settings: {},
    },
    defaultNetwork: 'zkSyncNetwork',
    networks: {
        hardhat: {
            zksync: true,
        },
        zkSyncNetwork: {
            allowUnlimitedContractSize: true,
            url: 'http://0.0.0.0:8011',
            ethNetwork: 'http://0.0.0.0:8545',
            zksync: true,
        },
        zkSyncTestnet: {
            allowUnlimitedContractSize: true,
            url: 'https://sepolia.era.zksync.dev',
            ethNetwork: 'https://sepolia.infura.io/v3/1d9d3e9f5c0b4b0e8b2e1b2b8b0b0b0b',
            zksync: true,
        },
    },
    solidity: {
        version: '0.8.9',
    },
};

export default config;
