require("../../../src/index");

module.exports = {
  zksolc: {
    version: "0.1.0",
    compilerSource: "docker",
    settings: {
      optimizer: {
        enabled: true,
      },
      experimental: {
        dockerImage: "matterlabs/zksolc"
      }
    },
  },
  networks: {
    hardhat: {
      zksync: true,
    },
  },
  solidity: {
      version: "0.8.11"
  }
};
