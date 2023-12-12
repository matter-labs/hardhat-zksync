import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-upgradable';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: 'latest',
        compilerSource: 'binary',
        settings: {
            optimizer: {
                enabled: true,
            },
        },
    },
    defaultNetwork:'zkSyncNetwork',
    networks: {
        hardhat: {
            zksync: true,
        },
        eth: {
            zksync: true,
            url: 'http://localhost:8545',
        },
        zkSyncNetwork: {
            zksync: true,
            ethNetwork: 'eth',
            url: 'http://localhost:3050',
        },
    },
    solidity: {
        version: '0.8.20',
    },
};

export default config;
