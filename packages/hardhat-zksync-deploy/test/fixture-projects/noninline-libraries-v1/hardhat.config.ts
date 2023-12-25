import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0x20eEc2827b98Fe39aD561fd8F27498aa98073426"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x735F9C009c31462Ed2D8Af8ACD0Ec822d3d65bCe"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0x4AfAD90CB0fbBa110c8e05C36eE45e878BA497E8"
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