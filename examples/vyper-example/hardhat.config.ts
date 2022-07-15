import "@nomiclabs/hardhat-vyper";
import "@matterlabs/hardhat-zksync-vyper";
import "@matterlabs/hardhat-zksync-deploy";
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  zkvyper: {
    version: "0.1.0",
    compilerSource: "docker",
    settings: {
      experimental: {
        dockerImage: "matterlabs/zkvyper",
        tag: "latest"
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
  // Currently, only Vyper ^0.3.3 is supported.
  vyper: {
    version: "0.3.3"
  },
};

export default config;
