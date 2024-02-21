import "hardhat/types/runtime";

import type {PublicClient, PublicClientConfig} from "viem";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    zkViem: {
      getPublicClient(
        publicClientConfig?: Partial<PublicClientConfig>
      ): Promise<PublicClient>;
    };
  }
}