import '@matterlabs/hardhat-zksync-solc';
import '../../../src/index';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0x09Bf23a1796a5fBf6D11BE3c7563583d42C94eA7"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x5a42839A0E5020F6352A0Bb74Ee18Be8cAde2b10"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0x5AfD77EdCeb6df7bf8F00bcD382fCb44B019b20a"
                  }
                }
        },
    },
    defaultNetwork: 'zkSyncNetwork',
    networks: {
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork: {
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            zksync: true,
            accounts: ['0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110'],
        },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        version: '0.8.17',
    },
};

export default config;
