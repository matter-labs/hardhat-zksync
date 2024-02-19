import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-upgradable';
import '@matterlabs/hardhat-zksync-upgradable/dist/src/type-extensions';

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
        sepolia:{
            url: 'https://sepolia.era.zksync.dev',
            ethNetwork: 'https://eth-sepolia.g.alchemy.com/v2/KaTL0rhcEuEBNLqU2tqlqvIwLpoClqTH',
            zksync:true,
          },
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
        },
    },
    solidity: {
        version: '0.8.20',
    },
};

export default config;
