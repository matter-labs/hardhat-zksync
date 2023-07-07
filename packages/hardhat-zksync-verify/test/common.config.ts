import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@nomicfoundation/hardhat-verify';
import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: 'latest',
        compilerSource: 'binary',
    },
    networks: {
        hardhat: {
            zksync: false,
        },
        customNetwork: {
            zksync: true,
            url: '',
            ethNetwork: 'unknown',
        },
        testnet: {
            zksync: true,
            url: 'https://zksync2-testnet.zksync.dev',
            ethNetwork: 'goerli',
            verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification',
        },
    },
    solidity: {
        version: '0.8.20',
    },
};

export default config;
