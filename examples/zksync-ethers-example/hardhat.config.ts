import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-ethers';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        settings: {
            isSystem: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork: 'zkSyncLocal',
    networks: {
        zkSyncLocal: {
            zksync: true,
            url: "http://localhost:3050",
            accounts: [
                '0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e',
                '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3',
            ]
        },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        version: '0.8.17',
    },
};

export default config;
