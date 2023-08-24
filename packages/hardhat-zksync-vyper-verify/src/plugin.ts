import { Artifact, Artifacts, HardhatRuntimeEnvironment } from 'hardhat/types';
import { isFullyQualifiedName } from 'hardhat/utils/contract-names';
import {
    MULTIPLE_MATCHING_CONTRACTS,
    CONTRACT_NAME_NOT_FOUND,
    NO_MATCHING_CONTRACT,
    CONST_ARGS_ARRAY_ERROR,
    PENDING_CONTRACT_INFORMATION_MESSAGE,
} from './constants';
import { ZkSyncVerifyPluginError } from './errors';
import { areSameBytecodes, encodeArguments } from './utils';
import chalk from 'chalk';
import { VyperFilesCache, getVyperFilesCachePath } from '@nomiclabs/hardhat-vyper/dist/src/cache';
import { Parser } from '@nomiclabs/hardhat-vyper/dist/src/parser';
import { Resolver, ResolvedFile } from '@nomiclabs/hardhat-vyper/dist/src/resolver';
import { TASK_COMPILE_VYPER_READ_FILE } from '@nomiclabs/hardhat-vyper/dist/src/task-names';
import { VerificationStatusResponse } from './zksync-block-explorer/verification-status-response';
import { checkVerificationStatusService } from './zksync-block-explorer/service';
import { CacheResolveFileInfo } from './types';

export async function inferContractArtifacts(
    artifacts: Artifacts,
    deployedBytecode: string
): Promise<any> {
    const artifactMatches = [];
    const fqNames = await artifacts.getAllFullyQualifiedNames();

    for (const fqName of fqNames) {
        const artifact: Artifact = await artifacts.readArtifact(fqName);

        if (artifact === undefined) {
            continue;
        }

        if (!areSameBytecodes(deployedBytecode, artifact.deployedBytecode)) {
            continue;
        }

        if (artifact !== null) {
            artifactMatches.push(artifact);
            break;
        }
    }

    if (artifactMatches.length === 0) throw new ZkSyncVerifyPluginError(NO_MATCHING_CONTRACT);

    if (artifactMatches.length > 1) throw new ZkSyncVerifyPluginError(MULTIPLE_MATCHING_CONTRACTS);

    return artifactMatches[0];
}

export async function checkContractName(artifacts: Artifacts, contractFQN: string) {
    if (contractFQN !== undefined) {
        if (!isFullyQualifiedName(contractFQN)) {
            throw new ZkSyncVerifyPluginError(
                `A valid fully qualified name was expected. Fully qualified names look like this: "contracts/AContract.sol:TheContract"
Instead, this name was received: ${contractFQN}`
            );
        }

        if (!(await artifacts.artifactExists(contractFQN))) {
            throw new ZkSyncVerifyPluginError(`The contract ${contractFQN} is not present in your project.`);
        }
    }
    else {
        throw new ZkSyncVerifyPluginError(CONTRACT_NAME_NOT_FOUND);
    }
}

export async function checkVerificationStatus(args: { verificationId: number }, hre: HardhatRuntimeEnvironment) {
    let isValidVerification = await executeVeificationWithRetry(args.verificationId, hre.network.verifyURL);

    if (isValidVerification?.errorExists()) {
        throw new ZkSyncVerifyPluginError(isValidVerification.getError());
    }
    console.info(chalk.green(`Contract successfully verified on zkSync block explorer!`));
    return true;
}


export async function getDeployArgumentEncoded(constructorArguments: any, artifact: Artifact): Promise<string> {
    if (!Array.isArray(constructorArguments)) {
        if (!constructorArguments.startsWith('0x')) {
            throw new ZkSyncVerifyPluginError(chalk.red(CONST_ARGS_ARRAY_ERROR));
        }
        return constructorArguments;
    }
    return '0x' + (await encodeArguments(artifact.abi, constructorArguments));
}

export async function getCacheResolvedFileInformation(contractFQN: string, sourceName: string, hre: HardhatRuntimeEnvironment): Promise<CacheResolveFileInfo> {
    const vyperFilesCachePath = getVyperFilesCachePath(hre.config.paths);

    let vyperFilesCache = await VyperFilesCache.readFromFile(
        vyperFilesCachePath
    );

    const contractCache = vyperFilesCache.getEntries().find((entry) => contractFQN.includes(entry.sourceName));

    if (contractCache === undefined) {
        throw new ZkSyncVerifyPluginError(chalk.red('Contract not found in cache'));
    }

    const parser = new Parser(vyperFilesCache);

    const resolver = new Resolver(
        hre.config.paths.root,
        parser,
        (absolutePath: string) =>
            hre.run(TASK_COMPILE_VYPER_READ_FILE, { absolutePath })
    );

    const resolvedFile = await resolver.resolveSourceName(sourceName);

    if (resolvedFile === undefined) {
        throw new ZkSyncVerifyPluginError(chalk.red('Reolved file not found for this contract'));
    }

    return {
        resolvedFile: resolvedFile,
        contractCache: contractCache
    }
}

export async function executeVeificationWithRetry(
    requestId: number,
    verifyURL: string,
    maxRetries = 5,
    delayInMs = 1500
): Promise<VerificationStatusResponse | undefined> {
    let retries = 0;

    while (true) {
        const response = await checkVerificationStatusService(requestId, verifyURL);
        if (response.isVerificationSuccess() || response.isVerificationFailure()) {
            return response;
        }
        retries += 1;
        if (retries > maxRetries) {
            console.info(chalk.cyan(PENDING_CONTRACT_INFORMATION_MESSAGE(requestId)));
            return;
        }
        await delay(delayInMs);
    }
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


export async function getResolvedFiles(hre: HardhatRuntimeEnvironment): Promise<ResolvedFile[]> {

    const resolvedFiles: ResolvedFile[] = [];
    const fqNames = await hre.artifacts.getAllFullyQualifiedNames();

    for (const contractFQN of fqNames.filter((fqName) => !fqName.startsWith('@') && fqName.includes('.vy'))) {
        const sourceName = contractFQN.split(':')[0];
        const { resolvedFile } = await getCacheResolvedFileInformation(contractFQN, sourceName, hre);
        resolvedFiles.push(resolvedFile);
    }

    return resolvedFiles;
}

