import '@nomiclabs/hardhat-vyper';
import '@matterlabs/hardhat-zksync-vyper';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-verify-vyper';
import '@matterlabs/hardhat-zksync-zksync2js';


import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zkvyper: {
        version: 'latest',
        compilerSource: 'binary',
    },
    defaultNetwork:'testnet',
    networks: {
        hardhat: {
            zksync: true,
        },
        customNetwork: {    
            zksync: true,
            url: ''
        },
        testnet:{
            url: `https://sepolia.era.zksync.dev`,
            ethNetwork: 'ethNetwork',
            zksync:true,
            accounts: ["PRIVATE_KEY"]
        },
        ethNetwork:{
            url:'https://eth-sepolia.g.alchemy.com/v2/KaTL0rhcEuEBNLqU2tqlqvIwLpoClqTH'
        }
    },
    vyper: {
        version: '0.3.9',
    },
};

export default config;
