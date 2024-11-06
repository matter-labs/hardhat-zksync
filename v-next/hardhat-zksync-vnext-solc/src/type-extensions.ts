import "@ignored/hardhat-vnext/types/network";
import { ZkSolcConfig } from "./types.js";

declare module '@ignored/hardhat-vnext/types/config' {
    interface HardhatUserConfig {
        zksolc?: Partial<ZkSolcConfig>;
    }

    interface HardhatConfig {
        zksolc: ZkSolcConfig;
    }

    interface HardhatNetworkUserConfig {
        zksync?: boolean;
    }

    interface HttpNetworkUserConfig {
        zksync?: boolean;
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
    }

    interface HttpNetworkConfig {
        zksync: boolean;
    }

    interface SolcConfig {
        eraVersion?: string;
    }

    interface SolcUserConfig {
        eraVersion?: string;
    }
}

declare module "@ignored/hardhat-vnext/types/network" {
    interface NetworkConnection<
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the ChainTypeT must be declared in the interface but in this scenario it's not used
      ChainTypeT extends ChainType | string = DefaultChainType,
    > {
        zksync: boolean;
    }
  }
