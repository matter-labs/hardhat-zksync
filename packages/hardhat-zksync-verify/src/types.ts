import { CompilationJob, CompilerInput, CompilerOutput } from 'hardhat/types';

export interface Build {
    compilationJob: CompilationJob;
    input: CompilerInput;
    output: CompilerOutput;
    solcBuild: any;
}
export interface VerificationArgs {
    address?: string;
    // constructor args given as positional params
    constructorArgsParams: string[];
    // Filename of constructor arguments module
    constructorArgs?: string;
    // Fully qualified name of the contract
    contract?: string;
    // Filename of libraries module
    libraries?: string;

    // --list-networks flag
    listNetworks: boolean;
}

export interface Libraries {
    // This may be a fully qualified name
    [libraryName: string]: string;
}
