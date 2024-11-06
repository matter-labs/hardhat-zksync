import { HardhatRuntimeEnvironmentHooks } from "@ignored/hardhat-vnext/types/hooks";

export default async (): Promise<Partial<HardhatRuntimeEnvironmentHooks>> => ({
    created: async (context, hre) => {
      hre.solidity = {
        // Placeholder implementation for SolidityBuildSystem
        getRootFilePaths: () => [],
        build: () => {},
        getCompilationJobs: () => [],
        runCompilationJob: () => {},
        // Additional methods as needed
      }
    },
  });
  