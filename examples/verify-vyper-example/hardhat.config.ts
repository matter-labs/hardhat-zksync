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
            accounts: ["0x3ebca5a070d36c4e2b5f337a95c08f5decc8cbb40206fe919d4a5c34679c07c4"]
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
