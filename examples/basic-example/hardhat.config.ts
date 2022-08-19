import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.1.5",
    compilerSource: "binary",
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
  // Docker image only works for solidity ^0.8.0.
  // For earlier versions you need to use binary releases of zksolc.
  solidity: {
    version: "0.8.12"
  }
};

export default config;
