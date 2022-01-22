import { Artifact } from 'hardhat/types';

/**
 * Configuration for zkSync deploy plugin.
 */
export interface ZkDeployConfig {
    /**
     * Identifier of the zkSync network.
     * Can be set to the RPC address of network (e.g. `http://127.0.0.1:3030`).
     * Network IDs like `mainnet` or `rinkeby` will be supported in the future.
     */
    zkSyncNetwork: string;
    /**
     * Identifier of the Ethereum network.
     * Can be set either to the RPC address of network (e.g. `http://127.0.0.1:3030`)
     * or the network ID (e.g. `mainnet` or `rinkeby`).
     */
    ethNetwork: string;
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
