import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-upgradable';
import '@matterlabs/hardhat-zksync-ethers';

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
        zkSyncNetwork: {
            zksync: true,
            ethNetwork: 'http://0.0.0.0:8011',
            url: 'http://0.0.0.0:3050',
        },
    },
    solidity: {
        version: '0.8.20',
    },
};

export default config;
