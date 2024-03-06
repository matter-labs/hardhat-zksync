import '@matterlabs/hardhat-zksync-solc';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0x179793D3462E5cD1DD838dBA787ebDB25ac9ABFE"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x896a9Ae44e4De0D21911aCd520c5f573AE41c397"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0x50b4340684681379b1704C4B8Cb25724f8c34906"
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
