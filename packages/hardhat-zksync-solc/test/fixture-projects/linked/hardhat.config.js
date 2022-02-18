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
        dockerImage: "zksyncrobot/test-build"
      },
      libraries: {
        'contracts/Foo.sol': {
            'Foo': '0x0123456789abcdef0123456789abcdef01234567'
        }
      }
    },
  },
  solidity: {
      version: "0.8.11"
  }
};
