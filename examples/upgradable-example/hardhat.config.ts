import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-upgradable';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.3.7',
        compilerSource: 'binary',
        settings: {
            optimizer: {
                enabled: true,
            },
        },
    },
    defaultNetwork: 'zkSyncNetwork',
    networks: {
        goerli: {
            zksync: false,
            url: 'http://localhost:8545',
        },
        zkSyncNetwork: {
            zksync: true,
            ethNetwork: 'goerli',
            url: 'http://localhost:3050',
        },
    },
    solidity: {
        version: '0.8.19',
    },
};

export default config;
