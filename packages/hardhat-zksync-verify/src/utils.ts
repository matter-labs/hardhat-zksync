import axios from 'axios';
import chalk from 'chalk';
import { HardhatRuntimeEnvironment, SolcUserConfig } from 'hardhat/types';
import { ZkSyncVerifyPluginError } from './errors';
import { WRONG_CONSTRUCTOR_ARGUMENTS } from './constants';
import {
    CompilerSolcUserConfigNormalizer,
    OverrideCompilerSolcUserConfigNormalizer,
    SolcConfigData,
    SolcUserConfigNormalizer,
} from './config-normalizer';

export function handleAxiosError(error: any): never {
    if (axios.isAxiosError(error)) {
        throw new Error(
            `Axios error (code: ${error.code}) during the contract verification request\n Reason: ${error.response?.data}`,
        );
    } else {
        throw new ZkSyncVerifyPluginError(`Failed to send contract verification request\n Reason: ${error}`);
    }
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function encodeArguments(abi: any, constructorArgs: any[]) {
    const { Interface } = await import('@ethersproject/abi');

    const contractInterface = new Interface(abi);
    let deployArgumentsEncoded;
    try {
        deployArgumentsEncoded = contractInterface.encodeDeploy(constructorArgs).replace('0x', '');
    } catch (error: any) {
        const errorMessage = error.message.includes(WRONG_CONSTRUCTOR_ARGUMENTS)
            ? parseWrongConstructorArgumentsError(error.message)
            : error.message;

        throw new ZkSyncVerifyPluginError(errorMessage);
    }

    return deployArgumentsEncoded;
}

export function nextAttemptDelay(currentAttempt: number, baseDelay: number, baseNumberOfAttempts: number): number {
    if (currentAttempt < baseNumberOfAttempts) {
        return baseDelay;
    }

    return baseDelay * 2 ** (currentAttempt - baseNumberOfAttempts);
}

export async function retrieveContractBytecode(address: string, hre: HardhatRuntimeEnvironment): Promise<string> {
    const provider = hre.network.provider;
    const bytecodeString = (await provider.send('eth_getCode', [address, 'latest'])) as string;
    const deployedBytecode = bytecodeString.startsWith('0x') ? bytecodeString.slice(2) : bytecodeString;

    if (deployedBytecode.length === 0) {
        throw new ZkSyncVerifyPluginError(
            `The address ${address} has no bytecode. Is the contract deployed to this network?
  The selected network is ${hre.network.name}.`,
        );
    }
    return deployedBytecode;
}

export function parseWrongConstructorArgumentsError(string: string): string {
    // extract the values of the "types" and "values" keys from the string
    const data = JSON.parse(string.split('count=')[1].split(', value=')[0]);

    return `The number of constructor arguments you provided (${data.values}) does not match the number of constructor arguments the contract has been deployed with (${data.types}).`;
}

export async function extractModule(constructorArgsModulePath: string) {
    const constructorArguments = (await import(constructorArgsModulePath)).default;
    return constructorArguments;
}

export function getZkVmNormalizedVersion(solcVersion: string, zkVmSolcVersion: string): string {
    return `zkVM-${solcVersion}-${zkVmSolcVersion}`;
}

export function normalizeCompilerVersions(
    solcConfigData: SolcConfigData,
    zkSolcConfig: any,
    latestEraVersion: string,
    userConfigCompilers: SolcUserConfig[] | Map<string, SolcUserConfig>,
): string | undefined {
    const noramlizers: SolcUserConfigNormalizer[] = [
        new OverrideCompilerSolcUserConfigNormalizer(),
        new CompilerSolcUserConfigNormalizer(),
    ];

    const compiler = solcConfigData.compiler;
    return noramlizers
        .find((normalize) => normalize.suituble(userConfigCompilers, solcConfigData.file))
        ?.normalize(compiler, zkSolcConfig, latestEraVersion, userConfigCompilers, solcConfigData.file);
}

export function extractQueryParams(url: string): [string, { [k: string]: string }] {
    const parsedURL = new URL(url);

    const searchParams = new URLSearchParams(parsedURL.search);
    const params = Object.fromEntries(searchParams);

    const newURL = parsedURL.origin + parsedURL.pathname;

    return [newURL, params];
}

export function printVerificationErrors(errors: Record<string, ZkSyncVerifyPluginError>) {
    let errorMessage = 'hardhat-zksync-verify found one or more errors during the verification process:\n\n';

    for (const [subtaskLabel, error] of Object.entries(errors)) {
        errorMessage += `${subtaskLabel}:\n${error.message}\n\n`;
    }

    console.error(chalk.red(errorMessage));
}
