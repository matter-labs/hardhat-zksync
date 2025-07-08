import { CompilerOutputBytecode, HardhatRuntimeEnvironment } from 'hardhat/types';
import { FormatedLibrariesForConfig, Libraries } from '../types';
import { inferSolcVersion } from './metadata';
import {
    BuildInfo,
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
    hre: HardhatRuntimeEnvironment,
    sourceName: SourceName,
    contractName: ContractName,
    buildInfo: BuildInfo,
    deployedBytecode: Bytecode,
    libraries: Libraries,
): Promise<ContractInformation | null> {
    const contract: any = buildInfo.output.contracts[sourceName][contractName];

    let deployBytecodeSymbols: CompilerOutputBytecode | null = null;

    if (contract?.evm?.bytecode) {
        // Classic Solidity / Foundry artifact
        deployBytecodeSymbols = contract.evm.bytecode as CompilerOutputBytecode;
    } else if (contract?.bytecode) {
        // zkSolc artifact: flat "bytecode" string at top level
        deployBytecodeSymbols = {
            object: contract.bytecode as string,
            opcodes: '',
            sourceMap: '',
            linkReferences: {},
        };
    }

    if (!deployBytecodeSymbols || !deployBytecodeSymbols.object) {
        return null; // nothing to compare against
    }

    let analyzedBytecode =
        deployBytecodeSymbols !== null ? await compareBytecode(deployedBytecode, deployBytecodeSymbols) : null;

    if (analyzedBytecode !== null) {
        return {
            ...analyzedBytecode,
            compilerInput: buildInfo.input,
            contractOutput: contract,
            solcVersion: buildInfo.solcVersion,
            solcLongVersion: buildInfo.solcLongVersion,
            sourceName,
            contractName,
        };
    }

    // The comparison failed, which means the contract likely relies on
    // deploy-time library linking.  Let `solc` perform the ELF-linking step via
    // `hardhat compile:link`.  If the bytecode is *not* an ELF object, `solc`
    // will throw and we'll simply propagate the failure.
    let linkedBytecode: string | undefined;
    try {
        linkedBytecode = await hre.run('compile:link', {
            sourceName,
            contractName,
            libraries,
            withoutError: true,
        });
    } catch {
        // Any error here (including "not an ELF object") means we cannot verify.
        return null;
    }

    if (linkedBytecode) {
        analyzedBytecode = await compareBytecode(deployedBytecode, {
            object: linkedBytecode,
            opcodes: '',
            sourceMap: '',
            linkReferences: {},
        });
    }

    if (analyzedBytecode !== null) {
        return {
            ...analyzedBytecode,
            compilerInput: buildInfo.input,
            contractOutput: contract,
            solcVersion: buildInfo.solcVersion,
            solcLongVersion: buildInfo.solcLongVersion,
            sourceName,
            contractName,
            libraries: await resolveLibraries(hre, libraries),
        };
    }

    return null;
}

export async function resolveLibraries(
    hre: HardhatRuntimeEnvironment,
    libraries: Libraries,
): Promise<FormatedLibrariesForConfig> {
    const populatedLibraries: FormatedLibrariesForConfig = {};

    await Promise.all(
        Object.entries(libraries).map(async (libraryInfo) => {
            const artifact = await hre.artifacts.readArtifact(libraryInfo[0]);
            populatedLibraries[artifact.sourceName] = {
                [artifact.contractName]: libraryInfo[1],
            };
        }),
    );

    return populatedLibraries;
}

export async function compareBytecode(
    deployedBytecode: Bytecode,
    runtimeBytecodeSymbols: CompilerOutputBytecode,
): Promise<BytecodeExtractedData | null> {
    // We will ignore metadata information when comparing. Etherscan seems to do the same.
    const deployedExecutableSection = deployedBytecode.getExecutableSection();
    const runtimeBytecode = new Bytecode(runtimeBytecodeSymbols.object);

    if (deployedExecutableSection.length !== runtimeBytecode.getExecutableSection().length) {
        return null;
    }

    // Normalize deployed bytecode according to this contract.
    const { normalizedBytecode } = await normalizeBytecode(deployedExecutableSection, runtimeBytecodeSymbols);

    const { normalizedBytecode: referenceBytecode } = await normalizeBytecode(
        runtimeBytecodeSymbols.object,
        runtimeBytecodeSymbols,
    );

    // If we don't have metadata detected, it could still have keccak metadata hash.
    // We cannot check that here, so we will assume that it's present. If not, it will be caught
    // during verification.
    // Keccak hash is 32 bytes, but given that we're working with hex strings, it's 64 characters.
    const bytecodeLength = deployedBytecode.hasMetadata()
        ? deployedExecutableSection.length
        : deployedExecutableSection.length > 64
          ? deployedExecutableSection.length - 64
          : deployedExecutableSection.length;

    if (normalizedBytecode.slice(0, bytecodeLength) === referenceBytecode.slice(0, bytecodeLength)) {
        // The bytecode matches
        return {
            normalizedBytecode,
        };
    }

    return null;
}

export async function normalizeBytecode(
    bytecode: string,
    symbols: CompilerOutputBytecode,
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
