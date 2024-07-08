import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { HardhatUserConfig } from 'hardhat/config';
require('dotenv').config(); 

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        settings: {
            compilerPath: process.env.ZKSOLC_PATH,
            enableEraVMExtensions: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    deployerAccounts: {
        'ZKsyncNetwork': 1
    },
    defaultNetwork: "ZKsyncNetwork",
    networks: {
        hardhat: {
            zksync: true,
        },
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        ZKsyncNetwork: {
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            zksync: true,
            accounts: ['0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3', '0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959'],
        },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        version: '0.8.17',
    },
};

export default config;
