import '@matterlabs/hardhat-zksync-solc';
import '../../../src/index';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0x274968561C94fc4828C5f8c61fF529a4f12d4192"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x0C44a0458e96B783B67371Cf11431936c59D81d7"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0x959F933bB5ff30ae685768dB6646b7d810938CE3"
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
        },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        version: '0.8.17',
    },
};

export default config;
