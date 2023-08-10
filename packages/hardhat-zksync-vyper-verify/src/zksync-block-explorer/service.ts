import axios from 'axios';

import { handleAxiosError } from '../utils';
import { ZkSyncVerifyPluginError } from '../errors';
import { ZkSyncVyperBlockExplorerVerifyRequest } from './verify-contract-request';
import { VerificationStatusResponse } from './verification-status-response';

export class ZkSyncVyperBlockExplorerVerifyResponse {
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

export async function verifyContractRequest(
    req: ZkSyncVyperBlockExplorerVerifyRequest,
    verifyURL: string
): Promise<ZkSyncVyperBlockExplorerVerifyResponse> {
    let data;
    try {
        data = await axios.post(verifyURL, req, { headers: { 'Content-Type': 'application/json' } });

        const zkSyncBlockExplorerResponse = new ZkSyncVyperBlockExplorerVerifyResponse(data);

        if (!zkSyncBlockExplorerResponse.isOk()) {
            throw new ZkSyncVerifyPluginError(zkSyncBlockExplorerResponse.message);
        }

        return zkSyncBlockExplorerResponse;
    } catch (error) {
        handleAxiosError(error);
    }
}

export enum COMPILER_TYPE {
    VYPER, ZKVYPER
}

export async function getSupportedCompilerVersions(verifyURL: string | undefined, compilerType: COMPILER_TYPE): Promise<string[]> {
    try {
        const compilerTypePath = compilerType == COMPILER_TYPE.VYPER ? '/vyper_versions' : '/zkvyper_versions'
        const response = await axios.get(verifyURL + compilerTypePath);
        return response.data;
    } catch (error) {
        handleAxiosError(error);
    }
}

export async function checkVerificationStatusService(
    requestId: number,
    verifyURL: string
): Promise<VerificationStatusResponse> {
    let verificationStatusResponse;

    try {
        let data = await axios.get(verifyURL + `/${requestId}`);
        verificationStatusResponse = new VerificationStatusResponse(data);

        return verificationStatusResponse;
    } catch (error) {
        handleAxiosError(error);
    }
}
