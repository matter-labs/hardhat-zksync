import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.5.15',
        compilerSource: 'binary',
        settings: {
            codegen: 'yul',
        },
    },
    networks: {
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork: {
            url: 'http://0.0.0.0:8011',
            ethNetwork: 'ethNetwork',
            zksync: true,
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
        compilers: [{ version: "0.8.24" }, { version: "0.8.20" }],
    },
};

export default config;
