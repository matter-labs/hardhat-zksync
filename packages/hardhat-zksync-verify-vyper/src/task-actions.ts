import { Artifact, HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import {
    BYTECODES_ARE_NOT_SAME,
    COMPILER_VERSION_NOT_SUPPORTED,
    CONSTRUCTOR_MODULE_IMPORTING_ERROR,
    ENCODED_ARAGUMENTS_NOT_FOUND_ERROR,
    JSON_INPUT_CODE_FORMAT,
    NO_MATCHING_CONTRACT,
    NO_VERIFIABLE_ADDRESS_ERROR,
    TASK_CHECK_VERIFICATION_STATUS,
    TASK_COMPILE_VYPER,
    TASK_VERIFY_GET_ARTIFACT,
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
    TASK_VERIFY_VERIFY_VYPER,
    ZK_COMPILER_VERSION_NOT_SUPPORTED,
} from './constants';
import path from 'path';
import { ZkSyncVerifyPluginError } from './errors';
import chalk from 'chalk';
import { COMPILER_TYPE, getSupportedCompilerVersions, verifyContractRequest } from './zksync-block-explorer/service';
import { areSameBytecodes, retrieveContractBytecode } from './utils';
import { checkContractName, getCacheResolvedFileInformation, getDeployArgumentEncoded, getResolvedFiles, inferContractArtifacts } from './plugin';
import { ResolvedFile } from '@nomiclabs/hardhat-vyper/dist/src/resolver';

export async function verify(
    args: {
        address: string;
        constructorArgs: string;
        contract: string;
        constructorArgsParams: any[];
    },
    hre: HardhatRuntimeEnvironment
) {

    if (args.address === undefined) {
        throw new ZkSyncVerifyPluginError(NO_VERIFIABLE_ADDRESS_ERROR);
    }

    const { isAddress } = await import('@ethersproject/address');
    if (!isAddress(args.address)) {
        throw new ZkSyncVerifyPluginError(`${args.address} is an invalid address.`);
    }

    const constructorArguments: any[] = await hre.run(TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS, {
        constructorArgsModule: args.constructorArgs,
        constructorArgsParams: args.constructorArgsParams,
    });


    await hre.run(TASK_VERIFY_VERIFY_VYPER, {
        address: args.address,
        constructorArguments: constructorArguments,
        contract: args.contract
    });
}

export async function verifyContract(
    { address, contract: contractFQN, constructorArguments }: TaskArguments,
    hre: HardhatRuntimeEnvironment
): Promise<number> {
    await hre.run(TASK_COMPILE_VYPER, { quiet: true });

    const deployedBytecode = await retrieveContractBytecode(address, hre.network);

    const artifact = await hre.run(TASK_VERIFY_GET_ARTIFACT, { contractFQN, deployedBytecode });
    const artificatBytecode = artifact.bytecode;
    contractFQN = contractFQN ?? artifact.sourceName + ':' + artifact.contractName;

    const deployArgumentsEncoded = await getDeployArgumentEncoded(constructorArguments, artifact);

    if (!areSameBytecodes(artificatBytecode, deployedBytecode)) {
        throw new ZkSyncVerifyPluginError(chalk.red(BYTECODES_ARE_NOT_SAME));
    }

    // This contractCahce is used only to get the vyper version of the contract
    // TODO: check if there is any other way to get the vyper version without using the cache
    const { contractCache } = await getCacheResolvedFileInformation(contractFQN, artifact.sourceName, hre);

    const vyperVersion = contractCache.vyperConfig.version;

    const compilerPossibleVersions = await getSupportedCompilerVersions(hre.network.verifyURL, COMPILER_TYPE.VYPER);
    if (!compilerPossibleVersions.includes(vyperVersion)) {
        throw new ZkSyncVerifyPluginError(COMPILER_VERSION_NOT_SUPPORTED);
    }

    const zkVyperVersion = 'v' + hre.config.zkvyper.version;

    const zkCompilerPossibleVersions = await getSupportedCompilerVersions(hre.network.verifyURL, COMPILER_TYPE.ZKVYPER);
    if (!zkCompilerPossibleVersions.includes(zkVyperVersion)) {
        throw new ZkSyncVerifyPluginError(ZK_COMPILER_VERSION_NOT_SUPPORTED);
    }

    const resolvedFiles: ResolvedFile[] = await getResolvedFiles(hre);
    const contractsSourceCodesMap = Object.fromEntries(
        resolvedFiles.map((file) => [file.sourceName, file.content.rawContent])
    );

    let request = {
        contractAddress: address,
        sourceCode: contractsSourceCodesMap,
        codeFormat: JSON_INPUT_CODE_FORMAT,
        contractName: artifact.contractName,
        compilerVyperVersion: vyperVersion,
        compilerZkvyperVersion: zkVyperVersion,
        constructorArguments: deployArgumentsEncoded,
        optimizationUsed: true,
    };

    const response = await verifyContractRequest(request, hre.network.verifyURL);

    let verificationId = parseInt(response.message);
    console.info(chalk.cyan('Your verification ID is: ' + verificationId));

    await hre.run(TASK_CHECK_VERIFICATION_STATUS, { verificationId: verificationId });

    return verificationId;
}

export async function getConstructorArguments(
    args: any
): Promise<any> {
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

export async function getArtifact(
    { contractFQN, deployedBytecode }: TaskArguments,
    { artifacts }: HardhatRuntimeEnvironment
): Promise<Artifact> {

    if (contractFQN !== undefined) {
        checkContractName(artifacts, contractFQN);

        const artifact = await artifacts.readArtifact(contractFQN);

        if (artifact === null) {
            throw new ZkSyncVerifyPluginError(NO_MATCHING_CONTRACT);
        }

        return artifact;
    }

    return await inferContractArtifacts(artifacts, deployedBytecode);
}
