import axios from 'axios';

import { handleAxiosError } from '../utils';
import { VerificationStatusResponse } from '../zkscan/VerificationStatusResponse';
import { ZkSyncVerifyPluginError } from '../zksync-verify-plugin-error';
import { ZKScanVerifyRequest } from './ZkSyncVerifyContractRequest';

export class ZKScanResponse {
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

export async function checkVerificationStatus(
    requestId: string,
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

export async function verifyContractRequest(req: ZKScanVerifyRequest, verifyURL: string): Promise<ZKScanResponse> {
    let data;
    try {
        data = await axios.post(verifyURL, req, { headers: { 'Content-Type': 'application/json' } });

        const zKscanResponse = new ZKScanResponse(data);

        if (!zKscanResponse.isOk()) {
            throw new ZkSyncVerifyPluginError(zKscanResponse.message);
        }

        return zKscanResponse;
    } catch (error) {
        handleAxiosError(error);
    }
}
