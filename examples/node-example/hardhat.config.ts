import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-node';
import '@nomicfoundation/hardhat-chai-matchers';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.5.15',
        compilerSource: 'binary',
        settings: {
            enableEraVMExtensions: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork: 'inMemoryNode',
    networks: {
        hardhat: {
            zksync: true,
        },
        inMemoryNode: {
            url: "http://0.0.0.0:8011",
            ethNetwork: "",
            zksync: true,
        },
    },
    
    solidity: {
        version: '0.8.17',
    },
};

export default config;
