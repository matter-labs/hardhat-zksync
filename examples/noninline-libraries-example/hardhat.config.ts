import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0x11299fD33119D6a9024daA1D1a4E837E29b5A3A4"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x236fA3f84636802E1E0049230A5935c9eDC44538"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0xDbbA81061eE6de6c0227D6BC8D5BE01E2aBae276"
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