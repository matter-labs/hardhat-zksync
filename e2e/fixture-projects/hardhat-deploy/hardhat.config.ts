import '@matterlabs/hardhat-zksync-solc';
import 'hardhat-deploy'
import {node_url, accounts} from './utils/network';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        settings: {
            enableEraVMExtensions: true,
            isSystem:true,
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork:'dockerizedNode',
    networks: {
        hardhat: {
            zksync: true,
        },
        dockerizedNode: {
            url: "http://0.0.0.0:3050",
            ethNetwork: "http://0.0.0.0:8545",
            zksync: true,
            accounts: {mnemonic: "stuff slice staff easily soup parent arm payment cotton trade scatter struggle"}
          },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        compilers: [
            {
                version: '0.8.17',
                eraVersion: '1.0.0'
            },
            {
                version: '0.7.6',
            }
        ]}
};

export default config;
