import '@matterlabs/hardhat-zksync-solc';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0xEE4c64d0712198F2fddF9e2431D37bE554B5dED0"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x38a568ba3574E0C1591085665Ae1E6A13CA7AdFE"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0x055C9Ce9bA76b978095A4f8f3fb127567Bc6C792"
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
