import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-ethers';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        version: 'latest',
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
            url: 'https://sepolia.era.zksync.dev',
            zksync: true,
            verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
            accounts: ["PRIVATE_KEY"]
        },
        customNetwork: {    
            zksync: true,
            url: ''
        },
        testnet:{
            url: `https://sepolia.era.zksync.dev`,
            zksync:true,
            accounts: ["PRIVATE_KEY"]
        },
        ethNetwork:{
            url:'YOUR_URL_FOR_SEPOLIA'
        }
        
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
