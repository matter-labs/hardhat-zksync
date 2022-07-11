import "@nomiclabs/hardhat-vyper";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-vyper";
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  zksolc: {
    compilerSource: "binary",
  },
  zkvyper: {
    compilerSource: "docker",
    settings: {
      experimental: {
        dockerImage: "matterlabs/zkvyper",
        tag: "latest"
      }
    }
  },
  networks: {
    hardhat: {
      zksync: true,
    },
  },
  vyper: {
    version: "0.3.2"
  },
  solidity: {
    version: "0.8.12"
  }
};

export default config;
