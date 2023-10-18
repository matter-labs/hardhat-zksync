import '../../../../hardhat-zksync-solc/src/index'
import '../../../../hardhat-zksync-deploy/src/index';
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.3.14',
        compilerSource: 'binary',
        settings: {},
      },
    networks: {
        "hardhat": {
            zksync: true
        },
        zkSyncNetwork: {
            allowUnlimitedContractSize: true,
            url: 'http://localhost:8011',
            zksync: true,
        },
        zkSyncTestnet:{
            allowUnlimitedContractSize: true,
            url: "https://zksync2-testnet.zksync.dev",
            zksync: true,
            // verifyURL: "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
          },
    },
    solidity: {
        version: '0.8.9',
    }
};

export default config;
