import axios from 'axios';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ChainConfig } from '@nomicfoundation/hardhat-verify/types';
import { extractQueryParams, handleAxiosError } from '../../utils';
import {
    ContractVerifyDataInfo,
    VerificationService,
    VerificationServiceInitialVerifyRequest,
    VerificationServiceVerificationIdResponse,
} from '../service';
import { ZkSyncExplorerVerifyRequest } from '../verify-contract-request';
import { ZkSyncVerifyPluginError } from '../../errors';
import { ContractInformation } from '../../solc/types';
import { COMPILATION_ERRORS, NO_MATCHING_CONTRACT } from '../../constants';
import { ZksyncContractVerificationInvalidStatusCodeError } from '../errors';
import { ZksyncBlockExplorerResponse } from './verification-status-response';
import { builtinChains } from './chain-config';

export class ZkSyncExplorerService extends VerificationService<
    number,
    ZkSyncExplorerVerifyRequest,
    ZksyncBlockExplorerResponse
> {
    public static async fromChainConfig(hre: HardhatRuntimeEnvironment, chainConfig: ChainConfig) {
        const apiUrl = chainConfig.urls.apiURL;
        const browserUrl = chainConfig.urls.browserURL
            ? chainConfig.urls.browserURL.trim().replace(/\/$/, '')
            : undefined;

        return new ZkSyncExplorerService(hre, apiUrl, browserUrl);
    }

    public async getVerificationStatus(
        verificationId: number,
        contractInformation: ContractVerifyDataInfo,
    ): Promise<ZksyncBlockExplorerResponse> {
        try {
            const [verifyURL, params] = extractQueryParams(this.verifyUrl);

            const response = await axios.get(`${verifyURL}/${verificationId}`, { params });

            if (response.status !== 200) {
                throw new ZksyncContractVerificationInvalidStatusCodeError(
                    this.verifyUrl,
                    response.status,
                    response.data,
                );
            }

            const verificationStatusResponse = new ZksyncBlockExplorerResponse(response);

            if (verificationStatusResponse.isPending()) {
                return verificationStatusResponse;
            }

            if (verificationStatusResponse.isFailure()) {
                if (
                    verificationStatusResponse.getError() !== NO_MATCHING_CONTRACT &&
                    COMPILATION_ERRORS.filter((compilationError) =>
                        compilationError.pattern.test(verificationStatusResponse.getError()),
                    ).length === 0
                ) {
                    throw new ZkSyncVerifyPluginError(verificationStatusResponse.getError());
                }

                return verificationStatusResponse;
            }

            if (!verificationStatusResponse.isOk()) {
                throw new ZkSyncVerifyPluginError(verificationStatusResponse.getError());
            }

            if (verificationStatusResponse.isSuccess()) {
                console.log(`Successfully verified contract ${contractInformation.contractName} on the block explorer.
        ${this.getContractBorwserUrl(contractInformation.contractAddress)}
        `);
            }

            return verificationStatusResponse;
        } catch (error) {
            handleAxiosError(error);
        }
    }
    protected generateRequest(initialRequest: VerificationServiceInitialVerifyRequest): ZkSyncExplorerVerifyRequest {
        return initialRequest as ZkSyncExplorerVerifyRequest;
    }

    protected async getVerificationId(req: VerificationServiceInitialVerifyRequest): Promise<number> {
        try {
            const [verifyUrl, params] = extractQueryParams(this.verifyUrl);
            const request = this.generateRequest(req);
            const response = await axios.post(verifyUrl, request, params);
            const zkSyncBlockExplorerResponse = new ZkSyncBlockExplorerVerificationIdResponse(response);

            if (!zkSyncBlockExplorerResponse.isOk()) {
                throw new ZkSyncVerifyPluginError(zkSyncBlockExplorerResponse.message);
            }

            return parseInt(zkSyncBlockExplorerResponse.message, 10);
        } catch (error) {
            handleAxiosError(error);
        }
    }

    public async getSupportedCompilerVersions(): Promise<string[]> {
        try {
            const [verifyUrl, params] = extractQueryParams(this.verifyUrl);
            const response = await axios.get(`${verifyUrl}/solc_versions`, { params });
            return response.data;
        } catch (error) {
            handleAxiosError(error);
        }
    }

    protected async getSolcVersion(contractInformation: ContractInformation): Promise<string> {
        return contractInformation.solcVersion;
    }

    protected getContractBorwserUrl(address: string): string | undefined {
        return this.browserUrl || this.browserUrl === '' ? `${this.browserUrl}/address/${address}#contract` : '';
    }
}

export async function getProvidedChainConfig(hre: HardhatRuntimeEnvironment) {
    const currentChainId = parseInt(await hre.network.provider.send('eth_chainId'), 16);
    return hre.network.config.verifyURL
        ? {
              network: hre.network.name,
              chainId: currentChainId,
              urls: {
                  apiURL: hre.network.config.verifyURL,
                  browserURL:
                      hre.network.config.browserVerifyURL ??
                      builtinChains.find((b) => b.chainId === currentChainId)?.urls.browserURL ??
                      '',
              },
          }
        : undefined;
}

export class ZkSyncBlockExplorerVerificationIdResponse implements VerificationServiceVerificationIdResponse {
    public readonly status: number;
    public readonly message: string;

    constructor(response: any) {
        this.status = parseInt(response.status, 10);
        this.message = response.data;
    }

    public isOk() {
        return this.status === 200;
    }
}
