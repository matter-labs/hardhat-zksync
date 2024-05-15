import "@nomiclabs/hardhat-vyper";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-vyper";
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  zksolc: {
    compilerSource: "docker",
    settings: {
      viaYul: true,
      experimental: {
        dockerImage: "matterlabs/zksolc",
        tag: "latest"
      }
    }
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
  defaultNetwork:'dockerizedNode',
  networks: {
    hardhat: {
      zksync: true,
    },
    dockerizedNode: {
      url: "http://0.0.0.0:3050",
      ethNetwork: "http://0.0.0.0:8545",
      zksync: true,
    },
  },
  vyper: {
    version: "0.3.3"
  },
  solidity: {
    version: "0.8.15"
  }
};

export default config;
