import '@matterlabs/hardhat-zksync-upgradable';
import "@nomiclabs/hardhat-ethers"

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: 'latest',
        compilerSource: 'binary',
        settings: {
            optimizer: {
                enabled: true,
            },
        },
    },
    defaultNetwork:'sepolia',
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
            url: 'http://0.0.0.0:3050',
        },
    },
    solidity: {
        version: '0.8.20',
    },
};

export default config;