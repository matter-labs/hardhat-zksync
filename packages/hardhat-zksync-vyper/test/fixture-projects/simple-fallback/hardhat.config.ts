import '@nomiclabs/hardhat-vyper';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zkvyper: {
        version: 'latest',
        compilerSource: 'binary',
        settings: {
            optimizer: {
                fallback_to_optimizing_for_size: true,
            },
        },
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
