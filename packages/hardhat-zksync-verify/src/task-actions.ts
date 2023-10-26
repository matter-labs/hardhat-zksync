import { DependencyGraph, HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';

import { getSupportedCompilerVersions, verifyContractRequest } from './zksync-block-explorer/service';

import {
    TASK_COMPILE,
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
    TASK_VERIFY_VERIFY,
    TESTNET_VERIFY_URL,
    NO_VERIFIABLE_ADDRESS_ERROR,
    CONST_ARGS_ARRAY_ERROR,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
    TASK_VERIFY_GET_CONTRACT_INFORMATION,
    NO_MATCHING_CONTRACT,
    COMPILER_VERSION_NOT_SUPPORTED,
    TASK_CHECK_VERIFICATION_STATUS,
    JSON_INPUT_CODE_FORMAT,
    UNSUCCESSFUL_CONTEXT_COMPILATION_MESSAGE,
    ENCODED_ARAGUMENTS_NOT_FOUND_ERROR,
    CONSTRUCTOR_MODULE_IMPORTING_ERROR,
    BUILD_INFO_NOT_FOUND_ERROR,
} from './constants';

import { encodeArguments, retrieveContractBytecode } from './utils';
import { Libraries } from './types';
import { ZkSyncVerifyPluginError } from './errors';
import { parseFullyQualifiedName } from 'hardhat/utils/contract-names';
import chalk from 'chalk';
import path from 'path';

import { Bytecode, extractMatchingContractInformation } from './solc/bytecode';

import { ContractInformation } from './solc/types';
import { checkContractName, getLibraries, getSolidityStandardJsonInput, inferContractArtifacts } from './plugin';
import { TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH } from 'hardhat/builtin-tasks/task-names';

export async function verify(
    args: {
        address: string;
        constructorArgs: string;
        contract: string;
        constructorArgsParams: any[];
        libraries: string;
        noCompile: boolean;
    },
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>
) {
    if (!hre.network.zksync) {
        return await runSuper(args);
    }

    if (hre.network.verifyURL === undefined) {
        hre.network.verifyURL = TESTNET_VERIFY_URL;
    }

    if (args.address === undefined) {
        throw new ZkSyncVerifyPluginError(NO_VERIFIABLE_ADDRESS_ERROR);
    }

    const constructorArguments: any[] = await hre.run(TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS, {
        constructorArgsModule: args.constructorArgs,
        constructorArgsParams: args.constructorArgsParams,
    });

    const libraries: Libraries = await getLibraries(args.libraries);

    await hre.run(TASK_VERIFY_VERIFY, {
        address: args.address,
        constructorArguments: constructorArguments,
        contract: args.contract,
        libraries,
        noCompile: args.noCompile,
    });
}

export async function getCompilerVersions(
    _: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>
): Promise<string[]> {
    if (!hre.network.zksync) {
        return await runSuper();
    }

    const compilerVersions = hre.config.solidity.compilers.map((c) => c.version);
    if (hre.config.solidity.overrides !== undefined) {
        for (const { version } of Object.values(hre.config.solidity.overrides)) {
            compilerVersions.push(version);
        }
    }

    return compilerVersions;
}

export async function getConstructorArguments(
    args: any,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>
): Promise<any> {
    if (!hre.network.zksync) {
        return await runSuper(args);
    }

    if (typeof args.constructorArgsModule !== 'string') {
        return args.constructorArgsParams;
    }

    const constructorArgsModulePath = path.resolve(process.cwd(), args.constructorArgsModule);

    try {
        const constructorArguments = (await import(constructorArgsModulePath)).default;

        // Since our plugin supports both encoded and decoded constructor arguments, we need to check how are they passed
        if (!Array.isArray(constructorArguments) && !constructorArguments.startsWith('0x')) {
            throw new ZkSyncVerifyPluginError(ENCODED_ARAGUMENTS_NOT_FOUND_ERROR(constructorArgsModulePath));
        }
        return constructorArguments;
    } catch (error: any) {
        throw new ZkSyncVerifyPluginError(CONSTRUCTOR_MODULE_IMPORTING_ERROR(error.message), error);
    }
}

export async function verifyContract(
    { address, contract: contractFQN, constructorArguments, libraries, noCompile }: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>
): Promise<number> {
    if (!hre.network.zksync) {
        return await runSuper({ address, contractFQN, constructorArguments, libraries });
    }

    const { isAddress } = await import('@ethersproject/address');
    if (!isAddress(address)) {
        throw new ZkSyncVerifyPluginError(`${address} is an invalid address.`);
    }

    const deployedBytecodeHex = await retrieveContractBytecode(address, hre.network);
    const deployedBytecode = new Bytecode(deployedBytecodeHex);

    const compilerVersions: string[] = await hre.run(TASK_VERIFY_GET_COMPILER_VERSIONS);

    if (!noCompile) {
        await hre.run(TASK_COMPILE, { quiet: true });
    }

    const contractInformation: ContractInformation = await hre.run(TASK_VERIFY_GET_CONTRACT_INFORMATION, {
        contractFQN: contractFQN,
        deployedBytecode: deployedBytecode,
        matchingCompilerVersions: compilerVersions,
    });

    const solcVersion = contractInformation.solcVersion;

    let deployArgumentsEncoded;
    if (!Array.isArray(constructorArguments)) {
        if (constructorArguments.startsWith('0x')) {
            deployArgumentsEncoded = constructorArguments;
        } else {
            throw new ZkSyncVerifyPluginError(chalk.red(CONST_ARGS_ARRAY_ERROR));
        }
    } else {
        deployArgumentsEncoded =
            '0x' + (await encodeArguments(contractInformation.contractOutput.abi, constructorArguments));
    }

    const compilerPossibleVersions = await getSupportedCompilerVersions(hre.network.verifyURL);
    const compilerVersion: string = contractInformation.solcVersion;
    if (!compilerPossibleVersions.includes(compilerVersion)) {
        throw new ZkSyncVerifyPluginError(COMPILER_VERSION_NOT_SUPPORTED);
    }
    const compilerZksolcVersion = 'v' + contractInformation.contractOutput.metadata.zk_version;

    contractInformation.contractName = contractInformation.sourceName + ':' + contractInformation.contractName;

    const dependencyGraph: DependencyGraph = await hre.run(TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH, {
        sourceNames: [contractInformation.sourceName],
    });

    let request = {
        contractAddress: address,
        sourceCode: getSolidityStandardJsonInput(hre, dependencyGraph.getResolvedFiles()),
        codeFormat: JSON_INPUT_CODE_FORMAT,
        contractName: contractInformation.contractName,
        compilerSolcVersion: solcVersion,
        compilerZksolcVersion: compilerZksolcVersion,
        constructorArguments: deployArgumentsEncoded,
        optimizationUsed: true,
    };

    const response = await verifyContractRequest(request, hre.network.verifyURL);
    let verificationId = parseInt(response.message);

    console.info(chalk.cyan('Your verification ID is: ' + verificationId));

    try {
        await hre.run(TASK_CHECK_VERIFICATION_STATUS, { verificationId: verificationId });
    } catch (error: any) {
        // The first verirication attempt with 'minimal' source code was unnsuccessful.
        // Now try with the full source code from the compilation context.
        if (error.message !== NO_MATCHING_CONTRACT) {
            throw error;
        }
        console.info(chalk.red(UNSUCCESSFUL_CONTEXT_COMPILATION_MESSAGE));

        request.sourceCode = contractInformation.compilerInput;

        const response = await verifyContractRequest(request, hre.network.verifyURL);
        let verificationId = parseInt(response.message);

        console.info(chalk.cyan('Your verification ID is: ' + verificationId));
        await hre.run(TASK_CHECK_VERIFICATION_STATUS, { verificationId: verificationId });
    }

    return verificationId;
}

export async function getContractInfo(
    { contractFQN, deployedBytecode, matchingCompilerVersions }: TaskArguments,
    { artifacts }: HardhatRuntimeEnvironment
): Promise<any> {
    let contractInformation;

    if (contractFQN !== undefined) {
        checkContractName(artifacts, contractFQN);

        // Process BuildInfo here to check version and throw an error if unexpected version is found.
        const buildInfo: any = await artifacts.getBuildInfo(contractFQN);

        if (buildInfo === undefined) {
            throw new ZkSyncVerifyPluginError(BUILD_INFO_NOT_FOUND_ERROR(contractFQN));
        }

        const { sourceName, contractName } = parseFullyQualifiedName(contractFQN);
        contractInformation = await extractMatchingContractInformation(
            sourceName,
            contractName,
            buildInfo,
            deployedBytecode
        );

        if (contractInformation === null) {
            throw new ZkSyncVerifyPluginError(NO_MATCHING_CONTRACT);
        }
    } else {
        contractInformation = await inferContractArtifacts(artifacts, matchingCompilerVersions, deployedBytecode);
    }
    return contractInformation;
}
