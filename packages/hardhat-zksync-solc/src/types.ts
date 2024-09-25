import { Artifact, CompilerInput } from 'hardhat/types';

export interface ZkSolcConfig {
    version: string; // Currently ignored.
    compilerSource?: 'binary' | 'docker'; // Docker support is currently in an early experimental state.
    settings: {
        // Path to zksolc binary. Can be a URL.
        // If compilerSource == "docker", this option is ignored.
        // By default, the automatically downloaded binary is used.
        compilerPath?: string;
        // Used to cache missing library dependencies. This is used later to compile and deploy libraries.
        missingLibrariesPath?: string;
        // Whether there are missing libraries. This is used as a temp flag that will enable or disable logs for successful compilation.
        areLibrariesMissing?: boolean;
        // Optimizer settings
        optimizer?: {
            enabled?: boolean;
            [key: string]: any;
        };
        // Remove metadata hash from bytecode. If the option is ommited, the metadata hash will be appended by default.
        metadata?: {
            bytecodeHash?: 'none';
            useLiteralContent?: boolean;
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
        // Old way to support compilation of ZKsync-specific simulations. Transition to enableEraVMExtensions by default.
        isSystem?: boolean;
        // Whether to support compilation of ZKsync-specific simulations
        enableEraVMExtensions?: boolean;
        // Evmla intermediate representation. Transition to forceEVMLA by default.
        forceEvmla?: boolean;
        // Evmla intermediate representation
        forceEVMLA?: boolean;
        // Specific contracts present in source to be compiled
        contractsToCompile?: string[];
        // Specific only contracts forced to be compiled even if they are not present in source
        forceContractsToCompile?: string[];
        // Dump all IR (Yul, EVMLA, LLVM IR, assembly) to files in the specified directory. Only for testing and debugging.
        debugOutputDir?: string;
        // Suppress specified warnings. Currently supported: txorigin, sendtransfer
        suppressedWarnings?: string[];
        // Suppress specified errors. Currently supported: txorigin, sendtransfer
        suppressedErrors?: string[];
    };
}

export interface ZkSyncCompilerInput extends CompilerInput {
    // Suppress specified warnings. Currently supported: txorigin, sendtransfer
    suppressedWarnings?: string[];
    // Suppress specified errors. Currently supported: txorigin, sendtransfer
    suppressedErrors?: string[];
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

export interface MissingLibrary {
    contractName: string;
    contractPath: string;
    missingLibraries: string[];
}
