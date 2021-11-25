import { Artifact } from "hardhat/types";

// TODO: `zkSyncRpc` / `l1Network`: obscure and not consistent.
export interface ZkDeployConfig {
  zkSyncRpc: string;
  l1Network: string;
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
