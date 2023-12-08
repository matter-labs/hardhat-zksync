import '@nomiclabs/hardhat-vyper';
import '@matterlabs/hardhat-zksync-vyper';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-verify-vyper';
import '@matterlabs/hardhat-zksync-ethers';


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
            url:'YOUR_SEPOLIA_PROVIDER_URL'
        }
    },
    vyper: {
        version: '0.3.9',
    },
};

export default config;
