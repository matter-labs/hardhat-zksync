import { EthereumProvider, HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';
import { ChainConfig } from '@nomicfoundation/hardhat-verify/types';
import { delay, encodeArguments, nextAttemptDelay, retrieveContractBytecode } from '../utils';
import { ZkSyncVerifyPluginError } from '../errors';
import { Bytecode } from '../solc/bytecode';
import {
    COMPILER_VERSION_NOT_SUPPORTED,
    CONST_ARGS_ARRAY_ERROR,
    JSON_INPUT_CODE_FORMAT,
    PENDING_CONTRACT_INFORMATION_MESSAGE,
    TASK_COMPILE,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
    TASK_VERIFY_GET_CONTRACT_INFORMATION,
} from '../constants';
import { ContractInformation } from '../solc/types';
import { getMinimalResolvedFiles, getSolidityStandardJsonInput } from '../plugin';
import { ZkSyncEtherscanExplorerVerifyRequest, ZkSyncExplorerVerifyRequest } from './verify-contract-request';
import { VerificationStatusResponse } from './verification-status-response';
import { PROVIDED_CHAIN_IS_NOT_SUPPORTED_FOR_VERIFICATION } from './constants';

export type VerificationServiceVerificationIdReturnType = string | number;
export type VerificationServiceVerifyRequest = ZkSyncExplorerVerifyRequest | ZkSyncEtherscanExplorerVerifyRequest;
export type VerificationServiceInitialVerifyRequest = ZkSyncExplorerVerifyRequest;
export type VerificationServiceVerificationStatus = VerificationStatusResponse;
export interface VerificationServiceVerifyResponse<
    V extends VerificationServiceVerificationIdReturnType = VerificationServiceVerificationIdReturnType,
> {
    verificationId: V;
    contractVerifyDataInfo: ContractVerifyDataInfo;
}

export interface ContractVerifyDataInfo {
    contractName: string;
    contractAddress: string;
}

export abstract class VerificationService<
    ReturnVerificationIdType extends
        VerificationServiceVerificationIdReturnType = VerificationServiceVerificationIdReturnType,
    ContractVerifyRequestType extends VerificationServiceVerifyRequest = VerificationServiceVerifyRequest,
    VerificationStatusType extends VerificationServiceVerificationStatus = VerificationServiceVerificationStatus,
    VerificationServiceVerifyResponseType = VerificationServiceVerifyResponse<ReturnVerificationIdType>,
> {
    constructor(
        protected hre: HardhatRuntimeEnvironment,
        protected verifyUrl: string,
        protected browserUrl?: string,
    ) {}
    protected abstract generateRequest(
        initialRequest: VerificationServiceInitialVerifyRequest,
    ): ContractVerifyRequestType;
    protected abstract getVerificationId(
        initialRequest: VerificationServiceInitialVerifyRequest,
    ): Promise<ReturnVerificationIdType>;
    public abstract getVerificationStatus(
        verificationId: ReturnVerificationIdType,
        contractVerifyDataInfo: ContractVerifyDataInfo,
    ): Promise<VerificationStatusType>;
    protected abstract getSupportedCompilerVersions(): Promise<string[]>;
    protected abstract getSolcVersion(contractInformation: ContractInformation): Promise<string>;
    protected abstract getContractBorwserUrl(address: string): string | undefined;

    public static async getCurrentChainConfig(
        ethereumProvider: EthereumProvider,
        customChains: ChainConfig[],
        builtinChains: ChainConfig[],
    ): Promise<ChainConfig> {
        const currentChainId = parseInt(await ethereumProvider.send('eth_chainId'), 16);

        const currentChainConfig = [...[...customChains].reverse(), ...builtinChains].find(
            ({ chainId }) => chainId === currentChainId,
        );

        if (currentChainConfig === undefined) {
            throw new ZkSyncVerifyPluginError(PROVIDED_CHAIN_IS_NOT_SUPPORTED_FOR_VERIFICATION(currentChainId));
        }

        return currentChainConfig;
    }

    public async verify(
        address: string,
        contract: string,
        constructorArguments: any,
        libraries: any,
        noCompile: boolean,
        isWithFullContext: boolean = false,
    ): Promise<VerificationServiceVerifyResponseType> {
        const { isAddress } = await import('@ethersproject/address');
        if (!isAddress(address)) {
            throw new ZkSyncVerifyPluginError(`${address} is an invalid address.`);
        }

        const deployedBytecodeHex = await retrieveContractBytecode(address, this.hre);
        const deployedBytecode = new Bytecode(deployedBytecodeHex);

        if (!noCompile) {
            await this.hre.run(TASK_COMPILE, { quiet: true });
        }

        const compilerVersions: string[] = await this.hre.run(TASK_VERIFY_GET_COMPILER_VERSIONS);

        const contractInformation: ContractInformation = await this.hre.run(TASK_VERIFY_GET_CONTRACT_INFORMATION, {
            contract,
            deployedBytecode,
            matchingCompilerVersions: compilerVersions,
            libraries,
        });

        const optimizationUsed = contractInformation.compilerInput.settings.optimizer.enabled ?? false;

        let deployArgumentsEncoded;
        if (!Array.isArray(constructorArguments)) {
            if (constructorArguments.startsWith('0x')) {
                deployArgumentsEncoded = constructorArguments;
            } else {
                throw new ZkSyncVerifyPluginError(chalk.red(CONST_ARGS_ARRAY_ERROR));
            }
        } else {
            deployArgumentsEncoded = `0x${await encodeArguments(
                contractInformation.contractOutput.abi,
                constructorArguments,
            )}`;
        }

        const compilerPossibleVersions = await this.getSupportedCompilerVersions();
        const compilerVersion: string = contractInformation.solcVersion;
        if (!compilerPossibleVersions.includes(compilerVersion)) {
            throw new ZkSyncVerifyPluginError(COMPILER_VERSION_NOT_SUPPORTED);
        }

        const request: VerificationServiceInitialVerifyRequest = {
            contractAddress: address,
            sourceCode: getSolidityStandardJsonInput(
                this.hre,
                await getMinimalResolvedFiles(this.hre, contractInformation.sourceName),
                contractInformation.compilerInput,
            ),
            codeFormat: JSON_INPUT_CODE_FORMAT,
            contractName: `${contractInformation.sourceName}:${contractInformation.contractName}`,
            compilerSolcVersion: await this.getSolcVersion(contractInformation),
            compilerZksolcVersion: `v${contractInformation.contractOutput.metadata.zk_version}`,
            constructorArguments: deployArgumentsEncoded,
            optimizationUsed,
        };
        if (isWithFullContext) {
            request.sourceCode.sources = contractInformation.compilerInput.sources;
        }

        const verificationId = await this.getVerificationId(request);

        console.info(chalk.cyan(`Your verification ID is: ${verificationId}`));

        return {
            contractVerifyDataInfo: {
                contractName: request.contractName,
                contractAddress: request.contractAddress,
            },
            verificationId,
        } as VerificationServiceVerifyResponseType;
    }

    public async getVerificationStatusWithRetry(
        verificationId: ReturnVerificationIdType,
        contractVerifyDataInfo: ContractVerifyDataInfo,
        maxRetries = 11,
        baseRetries = 5,
        baseDelayInMs = 2000,
    ): Promise<VerificationStatusType> {
        let retries = 0;
        let response: VerificationStatusType;

        while (true) {
            response = await this.getVerificationStatus(verificationId, contractVerifyDataInfo);

            if (response.isPending()) {
                retries += 1;
                if (retries > maxRetries) {
                    throw new ZkSyncVerifyPluginError(PENDING_CONTRACT_INFORMATION_MESSAGE(this.browserUrl));
                }

                const delayInMs = nextAttemptDelay(retries, baseDelayInMs, baseRetries);
                await delay(delayInMs);
            } else {
                break;
            }
        }

        return response;
    }
}

export interface VerificationServiceVerificationIdResponse {
    isOk(): boolean;
}
