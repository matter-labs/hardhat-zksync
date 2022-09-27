import "@nomiclabs/hardhat-vyper";
import "@matterlabs/hardhat-zksync-vyper";
import "@matterlabs/hardhat-zksync-deploy";
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  zkvyper: {
    version: "1.1.4",
    compilerSource: "binary",
  },
  zkSyncDeploy: {
    zkSyncNetwork: "http://0.0.0.0:3050",
    ethNetwork: "http://0.0.0.0:8545",
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
