import "hardhat/types/config";

import { ZkSolcConfig } from "./types";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    zksolc?: Partial<ZkSolcConfig>;
  }

  interface HardhatConfig {
    zksolc: ZkSolcConfig;
  }
}
