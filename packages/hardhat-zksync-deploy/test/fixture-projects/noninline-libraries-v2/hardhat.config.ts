import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0x934015B82611519545e7aA38a521C0f74a4021E5"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x12F23B87aCb43E0C48c1B81D6EEE3dB9e1bCd63b"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0xe72D2bfB7b64F2266e8bdCB40bE3bcd0cb5Ff552"
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
            accounts:['0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110'],
        },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        version: '0.8.17',
    },
};

export default config;