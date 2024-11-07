import { HardhatPlugin } from '@ignored/hardhat-vnext/types/plugins';

const hardhatZKsolcPlugin: HardhatPlugin = {
    id: "hardhat-zksync-vnext-solc",
    hookHandlers:{
        hre: import.meta.resolve("./internal/solidity/hook-handlers/hre.js"),
    }
  };
  
  export default hardhatZKsolcPlugin;
  