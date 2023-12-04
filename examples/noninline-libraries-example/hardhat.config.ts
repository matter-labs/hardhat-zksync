import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0x5f2B1A703A8346221a5584070E45cd549Fd5c035"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x9DFc4aA1B6985F2fF8D6778Cf6De41B63ad24A6b"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0x0D0e34A06acb05E46FD4F576E70d342C81695978"
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