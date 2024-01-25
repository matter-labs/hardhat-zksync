import '@nomiclabs/hardhat-vyper';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';
import '../../../src/type-extensions';

const config: HardhatUserConfig = {
    zkvyper: {
        version: 'latest',
        compilerSource: 'binary',
    },
    networks: {
        hardhat: {
            zksync: true,
        },
        otherNetwork: {
            zksync: false,
            url: 'http://0.0.0.0:3050',
        },
        // ethNetwork: {
        //     url: 'http://0.0.0.0:8545',
        // },
        // zkSyncNetwork2:{
        //     url: 'http://0.0.0.0:3050',
        //     ethNetwork: 'ethNetwork',
        //     zksync: true,
        //     accounts: ["0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110","0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110"]
        // }
    },
    vyper: {
        version: '0.3.7',
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
