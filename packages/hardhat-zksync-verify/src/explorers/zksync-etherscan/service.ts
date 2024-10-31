import { ApiKey, ChainConfig } from '@nomicfoundation/hardhat-verify/types';
import axios from 'axios';
import qs from 'querystring';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
    ContractVerifyDataInfo,
    VerificationService,
    VerificationServiceInitialVerifyRequest,
    VerificationServiceVerificationIdResponse,
} from '../service';
import { ZksyncMissingApiKeyError } from '../zksync-block-explorer/errors';
import { extractQueryParams, handleAxiosError } from '../../utils';
import { ZkSyncVerifyPluginError } from '../../errors';
import { ZkSyncEtherscanExplorerVerifyRequest } from '../verify-contract-request';
import { TASK_VERIFY_GET_COMPILER_VERSIONS } from '../../constants';
import { ContractInformation } from '../../solc/types';
import { ZksyncContractVerificationInvalidStatusCodeError } from '../errors';
import { ZksyncEtherscanResponse } from './verification-status-response';
import { SOLC_COMPILER_VERSION_NOTFOUND, SOLC_COMPILERS_LIST, SOLC_COMPILERS_LIST_ERROR } from './constants';

export class ZkSyncEtherscanExplorerService extends VerificationService<
    string,
    ZkSyncEtherscanExplorerVerifyRequest,
    ZksyncEtherscanResponse
> {
    constructor(
        hre: HardhatRuntimeEnvironment,
        private apikey: string,
        verifyUrl: string,
        browserUrl?: string,
    ) {
        super(hre, verifyUrl, browserUrl);
    }

    public static async fromChainConfig(
        hre: HardhatRuntimeEnvironment,
        apiKey: ApiKey | undefined,
        chainConfig: ChainConfig,
    ) {
        const resolvedApiKey = resolveApiKey(apiKey, chainConfig.network);
        const apiUrl = chainConfig.urls.apiURL;
        const browserUrl = chainConfig.urls.browserURL
            ? chainConfig.urls.browserURL.trim().replace(/\/$/, '')
            : undefined;

        return new ZkSyncEtherscanExplorerService(hre, resolvedApiKey, apiUrl, browserUrl);
    }

    public async getVerificationStatus(
        verificationId: string,
        contractInformation: ContractVerifyDataInfo,
    ): Promise<ZksyncEtherscanResponse> {
        try {
            const [verifyUrl, params] = extractQueryParams(this.verifyUrl);
            const response = await axios.get(verifyUrl, {
                params: {
                    apikey: this.apikey,
                    module: 'contract',
                    action: 'checkverifystatus',
                    guid: verificationId,
                    ...params,
                },
            });

            if (response.status !== 200) {
                throw new ZksyncContractVerificationInvalidStatusCodeError(
                    this.verifyUrl,
                    response.status,
                    response.data,
                );
            }

            const zkSyncBlockExplorerResponse = new ZksyncEtherscanResponse(response.data);

            if (zkSyncBlockExplorerResponse.isPending()) {
                return zkSyncBlockExplorerResponse;
            }

            if (zkSyncBlockExplorerResponse.isFailure() || zkSyncBlockExplorerResponse.isAlreadyVerified()) {
                return zkSyncBlockExplorerResponse;
            }

            if (!zkSyncBlockExplorerResponse.isOk()) {
                throw new ZkSyncVerifyPluginError(zkSyncBlockExplorerResponse.message);
            }

            if (zkSyncBlockExplorerResponse.isSuccess()) {
                console.log(`Successfully verified contract ${contractInformation.contractName} on the block explorer.
        ${this.getContractBorwserUrl(contractInformation.contractAddress)}
        `);
            }

            return zkSyncBlockExplorerResponse;
        } catch (error) {
            handleAxiosError(error);
        }
    }

    protected generateRequest(
        initialRequest: VerificationServiceInitialVerifyRequest,
    ): ZkSyncEtherscanExplorerVerifyRequest {
        return {
            compilermode: 'zksync',
            module: 'contract',
            action: 'verifysourcecode',
            apikey: this.apikey,
            zksolcVersion: initialRequest.compilerZksolcVersion,
            contractaddress: initialRequest.contractAddress,
            contractname: initialRequest.contractName,
            sourceCode: initialRequest.sourceCode,
            codeformat: 'solidity-standard-json-input',
            compilerversion: initialRequest.compilerSolcVersion,
            constructorArguements: initialRequest.constructorArguments.slice(2),
        };
    }

    protected async getVerificationId(req: VerificationServiceInitialVerifyRequest): Promise<string> {
        try {
            const [verifyUrl, params] = extractQueryParams(this.verifyUrl);
            const request = this.generateRequest(req);
            const response = await axios.post(
                verifyUrl,
                qs.stringify({
                    ...request,
                    ...params,
                    sourceCode: JSON.stringify(request.sourceCode),
                }),
            );
            const zkSyncEtherscanResponse = new ZkSyncEtherscanVerificationIdResponse(response.data);

            if (!zkSyncEtherscanResponse.isOk()) {
                throw new ZkSyncVerifyPluginError(zkSyncEtherscanResponse.result);
            }

            return zkSyncEtherscanResponse.result;
        } catch (error) {
            handleAxiosError(error);
        }
    }

    protected getContractBorwserUrl(address: string): string | undefined {
        return this.browserUrl || this.browserUrl === '' ? `${this.browserUrl}/address/${address}#code` : '';
    }

    protected async getSupportedCompilerVersions(): Promise<string[]> {
        return await this.hre.run(TASK_VERIFY_GET_COMPILER_VERSIONS);
    }

    protected async getSolcVersion(contractInformation: ContractInformation): Promise<string> {
        const solcVersion = contractInformation.solcLongVersion;

        if (!solcVersion.startsWith('zkVM')) {
            return `v${solcVersion}`;
        }

        const response = await axios.get(SOLC_COMPILERS_LIST);

        if (response.status !== 200) {
            throw new ZkSyncVerifyPluginError(SOLC_COMPILERS_LIST_ERROR);
        }

        const normalSolcVersion = solcVersion.split('-')[1];
        const solcBuild = response.data.builds.find((b: any) => b.version === normalSolcVersion && !b.prerelease);

        if (!solcBuild) {
            throw new ZkSyncVerifyPluginError(SOLC_COMPILER_VERSION_NOTFOUND(normalSolcVersion));
        }

        return `v${solcBuild.longVersion}`;
    }
}

function resolveApiKey(apiKey: ApiKey | undefined, network: string) {
    if (apiKey === undefined || apiKey === '') {
        throw new ZksyncMissingApiKeyError(network);
    }

    if (typeof apiKey === 'string') {
        return apiKey;
    }

    const key = apiKey[network];

    if (key === undefined || key === '') {
        throw new ZksyncMissingApiKeyError(network);
    }

    return key;
}

export class ZkSyncEtherscanVerificationIdResponse implements VerificationServiceVerificationIdResponse {
    public readonly status: number;
    public readonly message: string;
    public readonly result: string;

    constructor(response: any) {
        this.status = parseInt(response.status, 10);
        this.message = response.message;
        this.result = response.result;
    }

    public isOk() {
        return this.status === 1 && this.message === 'OK';
    }
}
