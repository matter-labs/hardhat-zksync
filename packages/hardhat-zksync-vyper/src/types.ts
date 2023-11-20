import { Artifact } from 'hardhat/types';

export interface ZkVyperConfig {
    version: string; // Currently ignored.
    compilerSource?: 'binary' | 'docker'; // Docker support is currently in an early experimental state.
    settings: {
        // Path to zkvyper binary. If compilerSource == "docker", this option is ignored.
        // By default, zkvyper in $PATH is used.
        compilerPath?: string;
        optimizer?: {
            [key: string]: any;
        };
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
    };
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

// Internal interface used for compilation
export interface CompilerOptions {
    inputPaths: string[];
    compilerPath?: string;
    sourcesPath?: string;
}

export interface CompilerOutput {
    [fqn: string]: any;
    version: string;
}