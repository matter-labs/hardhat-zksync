require("../../../src/index");

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
  solidity: {
      version: "0.8.11"
  }
};
