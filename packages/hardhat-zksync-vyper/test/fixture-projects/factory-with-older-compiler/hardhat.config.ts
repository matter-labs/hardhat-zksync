import '@nomiclabs/hardhat-vyper';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zkvyper: {
        version: '1.3.17',
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
    },
    vyper: {
        version: '0.3.3',
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
