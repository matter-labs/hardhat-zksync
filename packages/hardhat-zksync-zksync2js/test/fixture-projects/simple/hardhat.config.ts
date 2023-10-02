import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    zksolc: {
        version: 'latest',
    },
    networks: {
        'zkSyncNetwork': {
            url: 'http://localhost:8011',
            ethNetwork: 'http://localhost:8545',
            zksync: true,
        },
    },
    solidity: {
        version: '0.8.9',
    }
};

export default config;
