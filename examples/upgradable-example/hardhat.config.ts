import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-upgradable';
import '@matterlabs/hardhat-zksync-ethers';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.5.15',
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
            ethNetwork: 'http://0.0.0.0:8545',
            url: 'http://0.0.0.0:8011',
        },
    },
    solidity: {
        version: '0.8.20',
    },
};

export default config;
