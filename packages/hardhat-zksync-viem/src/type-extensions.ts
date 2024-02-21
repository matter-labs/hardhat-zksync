import "hardhat/types/runtime";

import type {
  HardhatViemPublicClient,
} from "./types";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    viem: {
      getPublicClient(): Promise<HardhatViemPublicClient>;
    };
  }
}