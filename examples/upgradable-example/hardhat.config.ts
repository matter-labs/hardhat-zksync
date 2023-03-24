import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-upgradable';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.3.5',
        compilerSource: 'binary',
        settings: {
            isSystem: true,
        },
    },
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            zksync: true,
        },
        goerli: {
            zksync: false,
            url: '',
        },
        testnet: {
            zksync: true,
            ethNetwork: 'goerli',
            url: 'https://zksync2-testnet.zksync.dev',
        },
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
