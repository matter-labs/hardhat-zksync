import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-upgradable';

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
    defaultNetwork: 'zkTestnet',
    networks: {
        hardhat: {
            zksync: false,
        },
        eth: {
            zksync: false,
            url: 'http://localhost:8545',
        },
        zkSyncNetwork: {
            zksync: true,
            ethNetwork: 'eth',
            url: 'http://localhost:3050',
        },
        sepolia:{
            url:'https://sepolia.era.zksync.dev',
        },
        zkTestnet: {
            url: 'https://sepolia.era.zksync.dev', // you should use the URL of the zkSync network RPC
            ethNetwork: 'sepolia',
            zksync: true
        },
    },
    solidity: {
        version: '0.8.20',
    },
};

export default config;
