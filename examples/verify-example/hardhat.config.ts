import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-upgradable';
import '@matterlabs/hardhat-zksync-verify/dist/src/type-extensions'

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        version: '1.3.16',
        settings: {
            enableEraVMExtensions: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork: 'zkTestnet',
    networks: {     
        zkTestnet: {
            url: "https://sepolia.era.zksync.dev",
            zksync: true,
            ethNetwork:"eth",
            verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
        },
        eth: {
            url: "https://rpc.ankr.com/eth_sepolia"
        },
        customNetwork: {
            url: "",
            ethNetwork:"",
        }
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
