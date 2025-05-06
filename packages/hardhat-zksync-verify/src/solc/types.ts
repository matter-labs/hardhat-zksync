import { CompilerInput, CompilerOutputBytecode, CompilerOutputSources } from 'hardhat/types';

// Left as an interface since future compiler outputs can contain more than just a bytecode field
export interface BytecodeExtractedData {
    normalizedBytecode: string;
}

export type SourceName = string;
export type ContractName = string;

export interface ContractInformation {
    compilerInput: CompilerInput;
    solcLongVersion: string;
    solcVersion: string;
    sourceName: string;
    contractName: string;
    contractOutput: CompilerOutputContract;
}

export interface CompilerOutput {
    sources: CompilerOutputSources;
    contracts: {
        [sourceName: string]: {
            [contractName: string]: CompilerOutputContract;
        };
    };
}

export interface CompilerOutputContract {
    abi: any;
    evm: {
        bytecode: CompilerOutputBytecode;
        deployedBytecode: CompilerOutputBytecode;
        methodIdentifiers: {
            [methodSignature: string]: string;
        };
    };
    metadata: CompilerOutputMetadata;
}

export interface CompilerOutputMetadata {
    optimizer_settings: string;
    solc_metadata: string;
    zk_version: string;
}

export interface BytecodeSlice {
    start: number;
    length: number;
}

export interface BuildInfo {
    _format: string;
    id: string;
    solcVersion: string;
    solcLongVersion: string;
    input: CompilerInput;
    output: CompilerOutput;
}

export type NestedSliceReferences = BytecodeSlice[][];
