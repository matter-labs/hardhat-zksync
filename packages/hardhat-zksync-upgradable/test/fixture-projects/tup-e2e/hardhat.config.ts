import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: 'latest',
        compilerSource: 'binary',
        settings: {
            viaYul: true,
        },
    },
    networks: {
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork: {
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            zksync: true,
            forceDeploy: true,
        },
        hardhat: {
            zksync: true,
        },
        sepolia: {
            zksync: false,
            url: '',
        },
        testnet: {
            zksync: true,
            ethNetwork: 'sepolia',
            url: 'https://sepolia.era.zksync.dev',
        },
    },
    solidity: {
        version: '0.8.20',
    },
};

export default config;
