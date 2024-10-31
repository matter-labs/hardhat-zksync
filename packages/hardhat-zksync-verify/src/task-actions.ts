import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';

import { parseFullyQualifiedName } from 'hardhat/utils/contract-names';

import path from 'path';
import { getLatestEraVersion } from '@matterlabs/hardhat-zksync-solc/dist/src/utils';
import { ZKSOLC_COMPILER_PATH_VERSION } from '@matterlabs/hardhat-zksync-solc/dist/src/constants';

import { VerificationSubtask } from '@nomicfoundation/hardhat-verify';
import chalk from 'chalk';
import {
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
    NO_VERIFIABLE_ADDRESS_ERROR,
    NO_MATCHING_CONTRACT,
    ENCODED_ARAGUMENTS_NOT_FOUND_ERROR,
    CONSTRUCTOR_MODULE_IMPORTING_ERROR,
    BUILD_INFO_NOT_FOUND_ERROR,
    USING_COMPILER_PATH_ERROR,
    TASK_VERIFY_RESOLVE_ARGUMENTS,
    TASK_VERIFY_ZKSYNC_ETHERSCAN,
    TASK_VERIFY_ZKSYNC_EXPLORER,
    TASK_VERIFY_GET_VERIFICATION_SUBTASKS,
} from './constants';

import { extractModule, normalizeCompilerVersions, printVerificationErrors } from './utils';
import { Libraries } from './types';
import { ZkSyncVerifyPluginError } from './errors';

import { extractMatchingContractInformation } from './solc/bytecode';

import { checkContractName, getLibraries, inferContractArtifacts } from './plugin';
import {
    SolcMultiUserConfigExtractor,
    SolcSoloUserConfigExtractor,
    SolcStringUserConfigExtractor,
    SolcUserConfigExtractor,
} from './config-extractor';

export async function resolveArguments(
    args: {
        address: string;
        constructorArgs: string;
        contract: string;
        constructorArgsParams: any[];
        libraries: string;
        force: boolean;
        noCompile: boolean;
    },
    hre: HardhatRuntimeEnvironment,
    _: RunSuperFunction<TaskArguments>,
) {
    if (args.address === undefined) {
        throw new ZkSyncVerifyPluginError(NO_VERIFIABLE_ADDRESS_ERROR);
    }

    const constructorArguments: any[] = await hre.run(TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS, {
        constructorArgsModule: args.constructorArgs,
        constructorArgsParams: args.constructorArgsParams,
    });

    const libraries: Libraries = await getLibraries(args.libraries);

    return {
        address: args.address,
        constructorArguments,
        contract: args.contract,
        libraries,
        noCompile: args.noCompile,
    };
}

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
    runSuper: RunSuperFunction<TaskArguments>,
) {
    if (!hre.network.zksync) {
        return await runSuper(args);
    }

    const resolvedAruments = await hre.run(TASK_VERIFY_RESOLVE_ARGUMENTS, args);

    const verificationSubtasks: VerificationSubtask[] = await hre.run(TASK_VERIFY_GET_VERIFICATION_SUBTASKS);

    const errors: Record<string, ZkSyncVerifyPluginError> = {};
    for (const { label, subtaskName } of verificationSubtasks) {
        try {
            await hre.run(subtaskName, resolvedAruments);
        } catch (error) {
            errors[label] = error as ZkSyncVerifyPluginError;
        }
    }

    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
        printVerificationErrors(errors);
        process.exit(1);
    }
}

const extractors: SolcUserConfigExtractor[] = [
    new SolcStringUserConfigExtractor(),
    new SolcSoloUserConfigExtractor(),
    new SolcMultiUserConfigExtractor(),
];

export async function getCompilerVersions(
    _: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
): Promise<string[]> {
    if (!hre.network.zksync) {
        return await runSuper();
    }

    const userSolidityConfig = hre.userConfig.solidity;
    const zkSolcConfig = hre.config.zksolc;

    if (zkSolcConfig.version === ZKSOLC_COMPILER_PATH_VERSION) {
        throw new ZkSyncVerifyPluginError(USING_COMPILER_PATH_ERROR);
    }

    const extractedConfigs = extractors
        .find((extractor) => extractor.suitable(userSolidityConfig))
        ?.extract(userSolidityConfig);

    const latestEraVersion = await getLatestEraVersion();

    const compilerVersions = hre.config.solidity.compilers.map(
        (c) =>
            normalizeCompilerVersions(
                { compiler: c },
                zkSolcConfig,
                latestEraVersion,
                extractedConfigs?.compilers ?? [],
            ) ?? c.version,
    );

    if (hre.config.solidity.overrides !== undefined) {
        for (const [file, compiler] of Object.entries(hre.config.solidity.overrides)) {
            compilerVersions.push(
                normalizeCompilerVersions(
                    { compiler, file },
                    zkSolcConfig,
                    latestEraVersion,
                    extractedConfigs?.overides ?? new Map(),
                ) ?? compiler.version,
            );
        }
    }

    return compilerVersions;
}

export async function getConstructorArguments(
    args: any,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
): Promise<any> {
    if (!hre.network.zksync) {
        return await runSuper(args);
    }

    if (typeof args.constructorArgsModule !== 'string') {
        return args.constructorArgsParams;
    }

    const constructorArgsModulePath = path.resolve(process.cwd(), args.constructorArgsModule);

    try {
        const constructorArguments = await extractModule(constructorArgsModulePath);

        if (!Array.isArray(constructorArguments) && !constructorArguments.startsWith('0x')) {
            throw new ZkSyncVerifyPluginError(ENCODED_ARAGUMENTS_NOT_FOUND_ERROR(constructorArgsModulePath));
        }
        return constructorArguments;
    } catch (error: any) {
        throw new ZkSyncVerifyPluginError(CONSTRUCTOR_MODULE_IMPORTING_ERROR(error.message), error);
    }
}

export async function getVerificationSubtasks(
    _: TaskArguments,
    { config, network }: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
): Promise<VerificationSubtask[]> {
    if (!network.zksync) {
        return await runSuper();
    }

    const verificationSubtasks: VerificationSubtask[] = [];
    let isEtherscanRunned = false;
    if (config.etherscan.apiKey && config.etherscan.enabled) {
        isEtherscanRunned = true;
        verificationSubtasks.push({
            label: 'ZkSyncEtherscan',
            subtaskName: TASK_VERIFY_ZKSYNC_ETHERSCAN,
        });
    }

    if (network.config.enableVerifyURL) {
        verificationSubtasks.push({
            label: 'ZkSyncBlockExplorer',
            subtaskName: TASK_VERIFY_ZKSYNC_EXPLORER,
        });

        return verificationSubtasks;
    }

    if (isEtherscanRunned) {
        return verificationSubtasks;
    }

    console.warn(
        chalk.yellow(
            `[WARNING] Since Etherscan is disabled or the API key is missing, verification will default to the ZKSync block explorer.`,
        ),
    );

    verificationSubtasks.push({
        label: 'ZkSyncBlockExplorer',
        subtaskName: TASK_VERIFY_ZKSYNC_EXPLORER,
    });

    return verificationSubtasks;
}

export async function verifyContract(
    args: TaskArguments,
    { config, network, run }: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    if (!network.zksync) {
        return await runSuper(args);
    }
    let isEtherscanRunned = false;
    if (config.etherscan.apiKey && config.etherscan.enabled) {
        isEtherscanRunned = true;
        await run(TASK_VERIFY_ZKSYNC_ETHERSCAN, args);
    }

    if (network.config.enableVerifyURL) {
        return await run(TASK_VERIFY_ZKSYNC_EXPLORER, args);
    }

    if (isEtherscanRunned) {
        return;
    }

    console.warn(
        chalk.yellow(
            `[WARNING] Since Etherscan is disabled or the API key is missing, verification will default to the ZKSync block explorer.`,
        ),
    );

    return await run(TASK_VERIFY_ZKSYNC_EXPLORER, args);
}

export async function getContractInfo(
    { contractFQN, deployedBytecode, matchingCompilerVersions, libraries }: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
): Promise<any> {
    if (!hre.network.zksync) {
        return await runSuper({ contractFQN, deployedBytecode, matchingCompilerVersions, libraries });
    }

    const artifacts = hre.artifacts;
    let contractInformation;

    if (contractFQN !== undefined) {
        const _ = checkContractName(artifacts, contractFQN);

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
            deployedBytecode,
        );

        if (contractInformation === undefined || contractInformation === null) {
            throw new ZkSyncVerifyPluginError(NO_MATCHING_CONTRACT);
        }
    } else {
        contractInformation = await inferContractArtifacts(artifacts, matchingCompilerVersions, deployedBytecode);
    }
    return contractInformation;
}
