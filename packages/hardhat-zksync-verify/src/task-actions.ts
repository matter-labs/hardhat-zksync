import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';

import {
    getSupportedCompilerVersions,
    verifyContractRequest,
    ZkSyncBlockExplorerResponse as blockExplorerResponse,
} from './zksync-block-explorer/service';

import {
    TASK_COMPILE,
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
    TASK_VERIFY_GET_LIBRARIES,
    TASK_VERIFY_VERIFY,
    TESTNET_VERIFY_URL,
    NO_VERIFIABLE_ADDRESS_ERROR,
    CONST_ARGS_ARRAY_ERROR,
    TASK_VERIFY_GET_MINIMUM_BUILD,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
    TASK_VERIFY_GET_CONTRACT_INFORMATION,
    TASK_VERIFY_VERIFY_MINIMUM_BUILD,
    NO_MATCHING_CONTRACT,
} from './constants';

import {
    encodeArguments,
    executeVeificationWithRetry,
    removeMultipleSubstringOccurrences,
    retrieveContractBytecode,
} from './utils';
import { Build, Libraries } from './types';
import { ZkSyncBlockExplorerVerifyRequest } from './zksync-block-explorer/verify-contract-request';
import { ZkSyncVerifyPluginError } from './errors';
import { parseFullyQualifiedName } from 'hardhat/utils/contract-names';
import { VerificationStatusResponse } from './zksync-block-explorer/verification-status-response';

import { Bytecode, extractMatchingContractInformation } from './solc/bytecode';

import { ContractInformation } from './solc/types';
import { checkContractName, flattenContractFile, inferContractArtifacts } from './plugin';

export async function verify(
    args: {
        address: string;
        constructorArgs: string;
        contract: string;
        constructorArgsParams: any[];
        librariesModule: string;
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

    const libraries: Libraries = await hre.run(TASK_VERIFY_GET_LIBRARIES, {
        librariesModule: args.librariesModule,
    });

    return hre.run(TASK_VERIFY_VERIFY, {
        address: args.address,
        constructorArguments: constructorArguments,
        contract: args.contract,
        libraries,
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

    return hre.config.solidity.compilers.map((c) => c.version);
}

export async function verifyContract(
    { address, contract: contractFQN, constructorArguments, libraries }: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>
) {
    if (!hre.network.zksync) {
        return await runSuper({ address, contractFQN, constructorArguments, libraries });
    }

    const { isAddress } = await import('@ethersproject/address');
    if (!isAddress(address)) {
        throw new ZkSyncVerifyPluginError(`${address} is an invalid address.`);
    }

    if (!Array.isArray(constructorArguments)) {
        throw new ZkSyncVerifyPluginError(CONST_ARGS_ARRAY_ERROR);
    }

    const deployedBytecodeHex = await retrieveContractBytecode(address, hre.network);
    const deployedBytecode = new Bytecode(deployedBytecodeHex);

    const compilerVersions: string[] = await hre.run(TASK_VERIFY_GET_COMPILER_VERSIONS);

    await hre.run(TASK_COMPILE);

    const contractInformation: ContractInformation = await hre.run(TASK_VERIFY_GET_CONTRACT_INFORMATION, {
        contractFQN: contractFQN,
        deployedBytecode: deployedBytecode,
        matchingCompilerVersions: compilerVersions,
        libraries: libraries,
    });

    const sourceName = contractInformation.sourceName;
    const contractName = contractInformation.contractName;

    const minimumBuild: Build = await hre.run(TASK_VERIFY_GET_MINIMUM_BUILD, {
        sourceName: sourceName,
    });

    const solcVersion = contractInformation.solcVersion;

    const deployArgumentsEncoded =
        '0x' +
        (await encodeArguments(minimumBuild.output.contracts[sourceName][contractName].abi, constructorArguments));

    const compilerPossibleVersions = await getSupportedCompilerVersions(hre.network.verifyURL);
    const compilerVersion: string = minimumBuild.output.version;
    if (!compilerPossibleVersions.includes(compilerVersion)) {
        throw new ZkSyncVerifyPluginError(
            'Solidity compiler you used to compile the contract is not currently supported by zkSync block explorer!\nPlease use one of the supporting versions'
        );
    }
    const compilerZksolcVersion = 'v' + minimumBuild.output.zk_version;

    await hre.run(TASK_VERIFY_VERIFY_MINIMUM_BUILD, {
        minimumBuild,
        contractInformation,
        address,
        compilerZksolcVersion,
        solcVersion,
        deployArgumentsEncoded,
    });
}

export async function verifyMinimumBuild(
    {
        minimumBuild,
        contractInformation,
        address,
        compilerZksolcVersion,
        solcVersion,
        deployArgumentsEncoded,
    }: TaskArguments,
    hre: HardhatRuntimeEnvironment
): Promise<boolean> {
    const minimumBuildContractBytecode =
        minimumBuild.output.contracts[contractInformation.sourceName][contractInformation.contractName].evm.bytecode
            .object;

    const matchedBytecode =
        contractInformation.compilerOutput.contracts[contractInformation.sourceName][contractInformation.contractName]
            .evm.bytecode.object;

    const input = await flattenContractFile(hre, contractInformation.sourceName);

    const flattenedFile = removeMultipleSubstringOccurrences(input, 'SPDX-License-Identifier:');

    if (minimumBuildContractBytecode === matchedBytecode) {
        const request: ZkSyncBlockExplorerVerifyRequest = {
            contractAddress: address,
            sourceCode: flattenedFile,
            contractName: contractInformation.contractName,
            compilerSolcVersion: solcVersion,
            compilerZksolcVersion: compilerZksolcVersion,
            constructorArguments: deployArgumentsEncoded,
            optimizationUsed: true,
        };

        const response: blockExplorerResponse = await verifyContractRequest(request, hre.network.verifyURL);

        let isValidVerification: VerificationStatusResponse = await executeVeificationWithRetry(
            response.message,
            hre.network.verifyURL
        );
        if (isValidVerification.errorExists()) {
            throw new ZkSyncVerifyPluginError(isValidVerification.getError());
        }
        console.info(`Successfully verified full build of contract ${request.contractName} on zkSync block explorer!`);
        return true;
    }

    console.log(`Compiling your contract excluding unrelated contracts did not produce identical bytecode.`);
    return false;
}

export async function getContractInfo(
    { contractFQN, deployedBytecode, matchingCompilerVersions, libraries }: TaskArguments,
    { network, artifacts }: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>
): Promise<any> {
    let contractInformation;

    if (!network.zksync) {
        return await runSuper({ contractFQN, deployedBytecode, matchingCompilerVersions, libraries });
    }

    if (contractFQN !== undefined) {
        checkContractName(artifacts, contractFQN);

        // Process BuildInfo here to check version and throw an error if unexpected version is found.
        const buildInfo = await artifacts.getBuildInfo(contractFQN);

        if (buildInfo === undefined) {
            throw new ZkSyncVerifyPluginError(
                `We couldn't find the sources of your "${contractFQN}" contract in the project.
  Please make sure that it has been compiled by Hardhat and that it is written in Solidity.`
            );
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
    return {
        ...contractInformation,
    };
}
