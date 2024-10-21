import { ZkSyncVerifyPluginError } from '../errors';

export class ZksyncContractVerificationInvalidStatusCodeError extends ZkSyncVerifyPluginError {
    constructor(url: string, statusCode: number, responseText: string) {
        super(`Failed to send contract verification request.
  Endpoint URL: ${url}
  The HTTP server response is not ok. Status code: ${statusCode} Response text: ${responseText}`);
    }
}
