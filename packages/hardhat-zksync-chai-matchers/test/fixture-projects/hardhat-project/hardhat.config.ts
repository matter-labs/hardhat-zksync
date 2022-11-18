// require("@nomiclabs/hardhat-ethers");
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

// module.exports = {
//   solidity: "0.8.4",
//   networks: {
//     localhost: {
//       url: `http://127.0.0.1:${process.env.HARDHAT_NODE_PORT}`,
//     },
//   },
// };

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
    zkSyncNetwork: "http://localhost:3050",
    ethNetwork: "http://localhost:8545",
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
