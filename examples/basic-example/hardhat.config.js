require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");

module.exports = {
  zksolc: {
    version: "0.1.0",
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
  zkSyncDeploy: {
    zkSyncRpc: "http://127.0.0.1:3050",
    l1Network: "http://127.0.0.1:8545",
  },
  solidity: {
    version: "0.8.10"
  }
};
