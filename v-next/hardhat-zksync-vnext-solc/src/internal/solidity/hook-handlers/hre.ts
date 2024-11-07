import { HardhatRuntimeEnvironmentHooks } from "@ignored/hardhat-vnext/types/hooks";
import { ZKsyncSolidityBuildSystemImplementation } from "../build-system.js";

export default async (): Promise<Partial<HardhatRuntimeEnvironmentHooks>> => ({
    created: async (context, hre) => {
      hre.solidity = new ZKsyncSolidityBuildSystemImplementation({
        solidityConfig: hre.config.solidity,
        projectRoot: hre.config.paths.root,
        soliditySourcesPaths: hre.config.paths.sources.solidity,
        artifactsPath: hre.config.paths.artifacts,
        cachePath: hre.config.paths.cache,
      });
    },
  });
  