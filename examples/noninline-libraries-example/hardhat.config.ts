import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-ethers';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            libraries: {
                  "contracts/ChildChildLib.sol": {
                    "ChildChildLib": "0xE133e0F478EEded30A645C8E794FaF545d00B461"
                  },
                  "contracts/ChildLib.sol": {
                    "ChildLib": "0x74e80440656f96eb80B68b9653E175260Abf4774"
                  },
                  "contracts/MathLib.sol": {
                    "MathLib": "0x960D20b7D660d00cdf1e63E8c73c97221f6c8F3F"
                  }
                }
        }
    },
    defaultNetwork: 'zkTestnet',
    networks: {
        zkTestnet: {
            url: 'https://sepolia.era.zksync.dev',
            ethNetwork: 'https://eth-sepolia.g.alchemy.com/v2/KaTL0rhcEuEBNLqU2tqlqvIwLpoClqTH',
            zksync: true,
            verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
            accounts: ["0x9d81dd1aaccd4bd613a641e42728ccfa49aaf5c0eda8ce5faeb159c493894329"],
        },
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