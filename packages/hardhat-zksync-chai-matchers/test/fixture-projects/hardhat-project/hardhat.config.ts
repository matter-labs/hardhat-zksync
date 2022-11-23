import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import { HardhatUserConfig } from 'hardhat/config';

import '../../../src/index';

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.2.0",
    compilerSource: "binary",
    settings: {
      experimental: {
        dockerImage: "matterlabs/zksolc",
        tag: "v1.2.0",
      },
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: "http://0.0.0.0:3050",
    ethNetwork: "http://0.0.0.0:8545",
  },
  solidity: {
    version: "0.8.11",
  },
  networks: {
    hardhat: {
      zksync: true,
    },
  },
};

export default config;
