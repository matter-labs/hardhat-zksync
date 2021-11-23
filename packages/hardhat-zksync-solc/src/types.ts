import { Artifact } from "hardhat/types";

export interface ZkSolcConfig {
  version: string; // Currently ignored.
  compilerSource: "binary"; // Later "docker" variant will also be supported.
  settings: {
    optimizer: {
      enabled: boolean;
    };
  };
}

/**
 * Description of the factory dependencies of a contract.
 * Dependencies are contracts that can be deployed by this contract via `CREATE` operation.
 */
export interface FactoryDeps {
  // A mapping from the contract hash to the contract bytecode.
  [contractHash: string]: string;
}

export interface ZkSyncArtifact extends Artifact {
  // List of factory dependencies of a contract.
  factoryDeps: FactoryDeps;
  // Mapping from the bytecode to the zkEVM assembly (used for tracing).
  sourceMapping: string;
}
