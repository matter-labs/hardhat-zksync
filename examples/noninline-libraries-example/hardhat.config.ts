import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0x492eF3C3DF63741657aE435dCF2E7230CbaA72DA"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0xBF36823A50C6f2013c855094e4BC55c5564f393E"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0x9FBac54eBF04e38e856B88A856eD7d3Bc182F03F"
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