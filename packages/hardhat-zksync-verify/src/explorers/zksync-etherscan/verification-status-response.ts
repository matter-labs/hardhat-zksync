import { VerificationStatusResponse } from '../verification-status-response';

export class ZksyncEtherscanResponse implements VerificationStatusResponse {
    public readonly status: number;
    public readonly message: string;

    constructor(response: any) {
        this.status = parseInt(response.status, 10);
        this.message = response.result;
    }
    public errorExists(): boolean {
        return !this.isSuccess() || !this.isPending();
    }

    public getError(): string | undefined {
        return this.errorExists() ? this.message : undefined;
    }

    public isPending() {
        return this.message === 'Pending in queue';
    }

    public isFailure() {
        return this.message.startsWith('Fail - Unable to verify');
    }

    public isSuccess() {
        return this.message === 'Pass - Verified';
    }

    public isBytecodeMissingInNetworkError() {
        return this.message.startsWith('Unable to locate ContractCode at');
    }

    public isAlreadyVerified() {
        return (
            this.message.startsWith('Contract source code already verified') ||
            this.message.startsWith('Already Verified')
        );
    }

    public isOk() {
        return this.status === 1;
    }
}
