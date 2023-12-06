import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: 'latest',
        compilerSource: 'binary',
    },
    networks: {
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
