import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.3.11',
        compilerSource: 'binary',
    },
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
        version: '0.8.20',
    },
};

export default config;
