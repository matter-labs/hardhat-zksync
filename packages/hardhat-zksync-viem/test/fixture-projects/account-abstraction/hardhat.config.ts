import "../../../src/index";
import "@matterlabs/hardhat-zksync-solc";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.3.19",
    compilerSource: "binary",
  },
  defaultNetwork: "testnet",
  networks: {
    hardhat: {
      zksync: true,
    },
    customNetwork: {
      zksync: true,
      url: "",
    },
    testnet: {
      zksync: true,
      url: "https://sepolia.era.zksync.dev",
    },
  },
  solidity: {
    version: "0.8.19",
  },
};

export default config;
