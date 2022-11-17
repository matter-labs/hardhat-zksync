import '@nomiclabs/hardhat-etherscan';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const zkSyncDeploy =
    process.env.NODE_ENV == 'test'
        ? {
              zkSyncNetwork: 'http://localhost:3050',
              ethNetwork: 'http://localhost:8545',
          }
        : {
              zkSyncNetwork: 'https://zksync2-testnet.zksync.dev',
              ethNetwork: 'goerli',
          };

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.2.0',
        compilerSource: 'binary',
    },
    networks: {
        hardhat: {
            zksync: false,
        },
        customNetwork: {
            zksync: true,
            url: '',
        },
        testnet: {
            zksync: true,
            url: 'https://zksync2-testnet.zksync.dev',
            verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification',
        },
    },
    zkSyncDeploy,
    solidity: {
        version: '0.8.16',
    },
};

export default config;
