import { CompilerInput, CompilerOutput } from 'hardhat/types';

// Left as an interface since future compiler outputs can contain more than just a bytecode field
export interface BytecodeExtractedData {
    normalizedBytecode: string;
}

export type SourceName = string;
export type ContractName = string;

export interface ContractInformation extends BytecodeExtractedData {
    compilerInput: CompilerInput;
    compilerOutput: CompilerOutput;
    solcVersion: string;
    sourceName: SourceName;
    contractName: ContractName;
    contract: CompilerOutput['contracts'][SourceName][ContractName];
}

export interface BytecodeSlice {
    start: number;
    length: number;
}

export type NestedSliceReferences = BytecodeSlice[][];
