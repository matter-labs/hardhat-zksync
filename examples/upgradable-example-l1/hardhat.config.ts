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
    defaultNetwork:'hardhat',
    networks: {
        hardhat: {
            zksync: false,
        },
        eth: {
            zksync: false,
            url: 'http://0.0.0.0:8545',
            accounts: ['0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110']
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