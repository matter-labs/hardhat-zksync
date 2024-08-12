import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-ethers';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        settings: {
            enableEraVMExtensions: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            accounts: [
                {privateKey: '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110', balance: '1000000000000000000000000'}
            ]
        },  
        zkSyncLocal: {
            zksync: true,
            url: "http://0.0.0.0:3050",
            ethNetwork: 'http://0.0.0.0:8545',
        },
        eth: {
            url: "http://0.0.0.0:8545",
            accounts: ['0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110']
        }
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        version: '0.8.17',
    },
};

export default config;