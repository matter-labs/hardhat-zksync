import '@matterlabs/hardhat-zksync-upgradable';
import "@matterlabs/hardhat-zksync-ethers"

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.5.15',
        compilerSource: 'binary',
        settings: {
            optimizer: {
                enabled: true,
            },
        },
    },
    networks: {
        hardhat: {
            zksync: false,
        },
        eth: {
            zksync: true,
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork: {
            zksync: true,
            ethNetwork: 'eth',
            url: 'http://0.0.0.0:8011',
        },
    },
    solidity: {
        compilers: [
            {
                version: '0.8.24',
            },
            {
                version: '0.8.20',
            }
        ]
    },
};

export default config;
