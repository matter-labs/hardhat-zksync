import axios from 'axios';

import { handleAxiosError } from '../utils';
import { VerificationStatusResponse } from './verification-status-response';
import { ZkSyncVerifyPluginError } from '../errors';
import { ZkSyncBlockExplorerVerifyRequest } from './verify-contract-request';

export class ZkSyncBlockExplorerResponse {
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

export async function verifyContractRequest(
    req: ZkSyncBlockExplorerVerifyRequest,
    verifyURL: string
): Promise<ZkSyncBlockExplorerResponse> {
    let data;
    try {
        data = await axios.post(verifyURL, req, { headers: { 'Content-Type': 'application/json' } });

        const zkSyncBlockExplorerResponse = new ZkSyncBlockExplorerResponse(data);

        if (!zkSyncBlockExplorerResponse.isOk()) {
            throw new ZkSyncVerifyPluginError(zkSyncBlockExplorerResponse.message);
        }

        return zkSyncBlockExplorerResponse;
    } catch (error) {
        handleAxiosError(error);
    }
}

export async function getSupportedCompilerVersions(verifyURL: string | undefined): Promise<string[]> {
    try {
        const response = await axios.get(verifyURL + '/solc_versions');
        return response.data;
    } catch (error) {
        handleAxiosError(error);
    }
}
