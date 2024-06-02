import '@matterlabs/hardhat-zksync';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: 'latest',
        compilerSource: 'binary',
        settings: {
            isSystem: true,
            optimizer: {
                enabled: true,
            },
        },
    },
    defaultNetwork:'zkSyncNetwork',
    networks: {
        hardhat: {
            zksync: true,
        },
        eth: {
            zksync: true,
            url: 'http://localhost:8545',
        },
        zkSyncNetwork: {
            zksync: true,
            ethNetwork: 'eth',
            url: 'http://localhost:3050',
            forceDeploy:true,
            accounts:["0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110"]
        },
    },
    solidity: {
        version: '0.8.20',
    },
};

export default config;
