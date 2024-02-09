import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0x41a46cc4f25F8d2C50527cF2cDD4b8c124DEe40D"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x3fbFf2EF1F865A141eD3d393b16bFc9B4E9418F3"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0xAaF1842C3660C163D2075feCbDb31c26e0e25e81"
                  }
                }
        }
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
        },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        version: '0.8.17',
    },
};

export default config;