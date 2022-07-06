import "@nomiclabs/hardhat-vyper";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-vyper";
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  zksolc: {
    compilerSource: "binary",
  },
  zkvyper: {
    compilerSource: "binary",
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
    version: "0.8.0"
  }
};

export default config;
