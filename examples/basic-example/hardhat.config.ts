import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  zksolc: {
    version: "0.1.0",
    compilerSource: "docker",
    settings: {
      experimental: {
        dockerImage: "matterlabs/zksolc",
        tag: "v1.1.0"
      }
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: "http://127.0.0.1:3050",
    ethNetwork: "http://127.0.0.1:8545",
  },
  networks: {
    hardhat: {
      zksync: true,
    },
  },
  solidity: {
    version: "0.8.12"
  }
};

export default config;
