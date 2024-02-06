import { Artifact } from 'hardhat/types';

/**
 * Identifier of the Ethereum network (layer 1).
 * Can be set either to the RPC address of network (e.g. `http://127.0.0.1:3030`)
 * or the network ID (e.g. `mainnet` or `sepolia`).
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

export interface MissingLibrary {
    contractName: string;
    contractPath: string;
    missingLibraries: string[];
}

export interface ContractInfo {
    contractFQN: ContractFullQualifiedName;
    address: string;
}

export interface ContractFullQualifiedName {
    contractName: string;
    contractPath: string;
}

export interface DeployerAccount {
    [networkName: string]: number | undefined;
}
