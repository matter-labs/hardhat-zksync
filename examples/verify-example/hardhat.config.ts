import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-zksync2js';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        version: '1.3.16',
        settings: {
            isSystem: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork: 'testnet',
    networks: {     
        zkTestnet: {
            url: "https://zksync2-testnet.zksync.dev",
            zksync: true,
            verifyURL: "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
            accounts: ["PRIVATE KEY"]
        },
        customNetwork: {    
            zksync: true,
            url: ''
        },
        testnet:{
            url: `https://sepolia.era.zksync.dev`,
            ethNetwork: 'ethNetwork',
            zksync:true,
            accounts: ["PRIVATE KEY"]
        },
        ethNetwork:{
            url:'https://eth-sepolia.g.alchemy.com/v2/KaTL0rhcEuEBNLqU2tqlqvIwLpoClqTH'
        }
        
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
