import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';

import { checkVerificationStatus, verifyContractRequest, ZKScanResponse } from './zkscan/ZkScanService';
import axios from 'axios';

import {
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
    TASK_VERIFY_GET_LIBRARIES,
    TASK_VERIFY_VERIFY,
    TESTNET_VERIFY_URL,
    NO_VERIFIABLE_ADDRESS_ERROR,
    TASK_VERIFY_CONTRACT,
    CONST_ARGS_ARRAY_ERROR,
    TASK_VERIFY_GET_MINIMUM_BUILD,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
} from './constants';

import { delay, encodeArguments, handleAxiosError } from './utils';
import { Build, Libraries } from './types';
import { ZKScanVerifyRequest } from './zkscan/ZkSyncVerifyContractRequest';
import { ZkSyncVerifyPluginError } from './zksync-verify-plugin-error';
import { parseFullyQualifiedName } from 'hardhat/utils/contract-names';
import { VerificationStatusResponse } from './zkscan/VerificationStatusResponse';

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
        return await runSuper(hre.config);
    }
    try {
        return await axios.get(hre.network.verifyURL + '/solc_versions');
    } catch (error) {
        handleAxiosError(error);
    }
}

export async function verifyContract(
    { address, contract, constructorArguments, libraries }: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>
) {
    if (!hre.network.zksync) {
        return await runSuper({ address, contract, constructorArguments, libraries });
    }

    if (address === undefined) {
        throw new ZkSyncVerifyPluginError(NO_VERIFIABLE_ADDRESS_ERROR);
    }

    return hre.run(TASK_VERIFY_CONTRACT, {
        contractAddress: address,
        contractFQN: contract,
        constructorArgs: constructorArguments,
        libraries: libraries,
    });
}

export async function sendVerificationRequest(
    { contractAddress, contractFQN, constructorArgs }: TaskArguments,
    hre: HardhatRuntimeEnvironment
) {
    const { sourceName, contractName } = parseFullyQualifiedName(contractFQN);

    if (!Array.isArray(constructorArgs)) {
        throw new ZkSyncVerifyPluginError(CONST_ARGS_ARRAY_ERROR);
    }

    if (!(await hre.artifacts.artifactExists(contractName))) {
        throw new ZkSyncVerifyPluginError(`The contract ${contractFQN} is not present in your project.`);
    }
    const minimumBuild: Build = await hre.run(TASK_VERIFY_GET_MINIMUM_BUILD, {
        sourceName: sourceName,
    });
    let contractContent = minimumBuild.input.sources[sourceName].content;

    const deployArgumentsEncoded =
        '0x' + (await encodeArguments(minimumBuild.output.contracts[sourceName][contractName].abi, constructorArgs));

    const compilerPossibleVersions = await hre.run(TASK_VERIFY_GET_COMPILER_VERSIONS);
    const compilerVersion: string = minimumBuild.output.version;
    if (!compilerPossibleVersions.data.includes(compilerVersion)) {
        throw new ZkSyncVerifyPluginError(
            'Solidity compiler you used to compile the contract is not currently supported by ZKScan!\nPlease use one of the supporting versions'
        );
    }
    const compilerZksolcVersion = 'v' + minimumBuild.output.zk_version;

    const request: ZKScanVerifyRequest = {
        contractAddress: contractAddress,
        sourceCode: contractContent,
        contractName: contractName,
        compilerSolcVersion: compilerVersion,
        compilerZksolcVersion: compilerZksolcVersion,
        constructorArguments: deployArgumentsEncoded,
        optimizationUsed: true,
    };
    const response: ZKScanResponse = await verifyContractRequest(request, hre.network.verifyURL);

    await delay(1000);

    let isValidVerification: VerificationStatusResponse = await checkVerificationStatus(
        response.message,
        hre.network.verifyURL
    );
    if (isValidVerification.errorExists()) {
        throw new ZkSyncVerifyPluginError(isValidVerification.getError());
    }

    console.log(`Successfully verified full build of contract ${contractName} on ZkScan!`);
}
