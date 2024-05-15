// eslint-disable-next-line
import '../../../src/index';
import '@matterlabs/hardhat-zksync-solc';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            viaYul: true,
        },
    },
    defaultNetwork: 'zkSyncNetwork',
    networks: {
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork: {
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            zksync: true,
            accounts: {
                // found in zksync-era github repo
                mnemonic: 'fine music test violin matrix prize squirrel panther purchase material script deal',
                path: "m/44'/60'/0'/1",
                initialIndex: 0,
                count: 2,
            },
        },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        version: '0.8.17',
    },
};

export default config;
