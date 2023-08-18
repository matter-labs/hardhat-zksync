import { Artifact } from 'hardhat/types';

/**
 * Identifier of the Ethereum network (layer 1).
 * Can be set either to the RPC address of network (e.g. `http://127.0.0.1:3030`)
 * or the network ID (e.g. `mainnet` or `goerli`).
 */
export type EthNetwork = string;

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

export interface ZkBuildInfo {
    _format: string;
    id: string;
    output: ZkCompilerOutput;
}

export interface ZkCompilerOutput {
    sources: ZkCompilerOutputSources;
  }
  
  export interface ZkCompilerOutputSource {
    id: number;
    ast: ZkAst;
  }
  
  export interface ZkCompilerOutputSources {
    [sourceName: string]: ZkCompilerOutputSource;
  }

  export interface ZkAst {
    absolutePath: string;
    nodes: ZkAstNode[];
  }

  
  export interface ZkAstNode {
    absolutePath: string;
    nodeType: string;
    canonicalName: string;
    contractKind: string;
    fullyImplemented: boolean;
  }

  export interface LibraryNode {
    contractName: string;
    libraries: LibraryNode[];
  }
