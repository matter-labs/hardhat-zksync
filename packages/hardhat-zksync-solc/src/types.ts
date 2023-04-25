import { Artifact } from 'hardhat/types';

export interface ZkSolcConfig {
    version: string; // Currently ignored.
    compilerSource?: 'binary' | 'docker'; // Docker support is currently in an early experimental state.
    settings: {
        // Path to zksolc binary. Can be a URL.
        // If compilerSource == "docker", this option is ignored.
        // By default, the automatically downloaded binary is used.
        compilerPath?: string;
        optimizer?: {
            enabled?: boolean;
            [key: string]: any;
        };
        // Remove metadata hash from bytecode. If the option is ommited, the metadata hash will be appended by default.
        metadata?: {
            bytecodeHash?: 'none';
        },
        // addresses of external libraries
        libraries?: {
            [file: string]: {
                [library: string]: string;
            };
        };
        experimental?: {
            dockerImage?: string;
            tag?: string;
        };
        // Whether to support compilation of zkSync-specific simulations
        isSystem?: boolean;
        // Force evmla
        forceEvmla?: boolean;
    };
}

export interface CompilerOutputSelection {
    [file: string]: { [contract: string]: string[] };
}

/**
 * Description of the factory dependencies of a contract.
 * Dependencies are contracts that can be deployed by this contract via `CREATE` operation.
 */
export interface FactoryDeps {
    // A mapping from the contract ID to the contract bytecode.
    // Example: `Factory.sol:Dep` -> `0xbee11a6eb371929dd8b85cf5d3434ef4c9aac5c01652a2b35d3e264e50d646c4`.
    [contractId: string]: string;
}

export interface ZkSyncArtifact extends Artifact {
    // List of factory dependencies of a contract.
    factoryDeps: FactoryDeps;
}
