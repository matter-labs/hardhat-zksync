import { BuildInfo, CompilerOutputBytecode } from 'hardhat/types';

import { inferSolcVersion } from './metadata';
import {
    BytecodeExtractedData,
    BytecodeSlice,
    ContractInformation,
    ContractName,
    NestedSliceReferences,
    SourceName,
} from './types';

export class Bytecode {
    private _bytecode: string;
    private _version: string;

    private _executableSection: BytecodeSlice;
    private _metadataSection: BytecodeSlice;

    constructor(bytecode: string) {
        this._bytecode = bytecode;
        const { solcVersion, metadataSectionSizeInBytes } = inferSolcVersion(Buffer.from(bytecode, 'hex'));
        this._version = solcVersion;
        this._executableSection = {
            start: 0,
            length: bytecode.length - metadataSectionSizeInBytes * 2,
        };
        this._metadataSection = {
            start: this._executableSection.length,
            length: metadataSectionSizeInBytes * 2,
        };
    }

    public getInferredSolcVersion(): string {
        return this._version;
    }

    public getExecutableSection(): string {
        const { start, length } = this._executableSection;
        return this._bytecode.slice(start, length);
    }

    public hasMetadata(): boolean {
        return this._metadataSection.length > 0;
    }
}

export async function extractMatchingContractInformation(
    sourceName: SourceName,
    contractName: ContractName,
    buildInfo: BuildInfo,
    deployedBytecode: Bytecode
): Promise<ContractInformation | null> {
    const contract = buildInfo.output.contracts[sourceName][contractName];

    if (contract.hasOwnProperty('evm')) {
        const { bytecode: runtimeBytecodeSymbols } = contract.evm;

        const analyzedBytecode = runtimeBytecodeSymbols
            ? await compareBytecode(deployedBytecode, runtimeBytecodeSymbols)
            : null;

        if (analyzedBytecode !== null) {
            return {
                ...analyzedBytecode,
                compilerInput: buildInfo.input,
                compilerOutput: buildInfo.output,
                solcVersion: buildInfo.solcVersion,
                sourceName,
                contractName,
                contract,
            };
        }

        return null;
    }

    return null;
}

export async function compareBytecode(
    deployedBytecode: Bytecode,
    runtimeBytecodeSymbols: CompilerOutputBytecode
): Promise<BytecodeExtractedData | null> {
    // We will ignore metadata information when comparing. Etherscan seems to do the same.
    const deployedExecutableSection = deployedBytecode.getExecutableSection();
    const runtimeBytecodeExecutableSectionLength = runtimeBytecodeSymbols.object.length;

    if (deployedExecutableSection.length !== runtimeBytecodeExecutableSectionLength) {
        return null;
    }

    // Normalize deployed bytecode according to this contract.
    const { normalizedBytecode } = await normalizeBytecode(deployedExecutableSection, runtimeBytecodeSymbols);

    const { normalizedBytecode: referenceBytecode } = await normalizeBytecode(
        runtimeBytecodeSymbols.object,
        runtimeBytecodeSymbols
    );

    if (
        normalizedBytecode.slice(0, deployedExecutableSection.length) ===
        referenceBytecode.slice(0, deployedExecutableSection.length)
    ) {
        // The bytecode matches
        return {
            normalizedBytecode,
        };
    }

    return null;
}

export async function normalizeBytecode(
    bytecode: string,
    symbols: CompilerOutputBytecode
): Promise<BytecodeExtractedData> {
    const nestedSliceReferences: NestedSliceReferences = [];

    // To normalize a library object we need to take into account its call protection mechanism
    // The runtime code of a library always starts with a push instruction (a zero of 20 bytes at compilation time)
    // This constant is replaced in memory by the current address and this modified code is stored in the contract
    const addressSize = 20;
    const push20OpcodeHex = '73';
    const pushPlaceholder = push20OpcodeHex + '0'.repeat(addressSize * 2);
    if (bytecode.startsWith(pushPlaceholder) && symbols.object.startsWith(push20OpcodeHex)) {
        nestedSliceReferences.push([{ start: 1, length: addressSize }]);
    }

    const sliceReferences = flattenSlices(nestedSliceReferences);
    const normalizedBytecode = zeroOutSlices(bytecode, sliceReferences);

    return { normalizedBytecode };
}

function flattenSlices(slices: NestedSliceReferences) {
    return ([] as BytecodeSlice[]).concat(...slices);
}

function zeroOutSlices(code: string, slices: Array<{ start: number; length: number }>): string {
    for (const { start, length } of slices) {
        code = [code.slice(0, start * 2), '0'.repeat(length * 2), code.slice((start + length) * 2)].join('');
    }

    return code;
}
