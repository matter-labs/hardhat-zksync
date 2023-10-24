import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '../../../src/index';

import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.3.14',
        compilerSource: 'binary',
        settings: {},
    },
    networks: {
        hardhat: {
            zksync: true,
        },
        zkSyncNetworkAccounts: {
            allowUnlimitedContractSize: true,
            url: 'http://localhost:3050',
            accounts: [
                '0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e',
                '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3',
            ],
            zksync: true,
        },
        zkSyncNetworkMenmonic: {
            allowUnlimitedContractSize: true,
            url: 'http://localhost:3050',
            accounts: {
                mnemonic: 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle',
            },
            zksync: true,
        },
        zkSyncNetworkEmptyAccounts: {
            allowUnlimitedContractSize: true,
            url: 'http://localhost:3050',
            accounts: [],
            zksync: true,
        },
    },
    solidity: {
        version: '0.8.9',
    },
};

export default config;
