import { HardhatPlugin } from '@ignored/hardhat-vnext/types/plugins';

const hardhatZKsolcPlugin: HardhatPlugin = {
    id: "hardhat-zksync-vnext-solc",
    hookHandlers:{
        hre: import.meta.resolve("./internal/hook-handlers/network.js"),
        config: import.meta.resolve("./internal/hook-handlers/network.js"),
        network: import.meta.resolve("./internal/hook-handlers/network.js")
    }
  };
  
  export default hardhatZKsolcPlugin;
  