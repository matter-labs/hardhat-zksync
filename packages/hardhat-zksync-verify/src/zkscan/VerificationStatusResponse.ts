enum VerificationStatusEnum {
    successful = 'successful',
    failed = 'failed',
    queued = 'queued',
    in_progress = 'in_progress',
}

export class VerificationStatusResponse {
    public readonly status: string;
    public readonly error: String | undefined;
    public readonly compilationErrors: Array<String> | undefined;

    constructor(response: any) {
        this.status = response.data.status;
        this.error = response.data.error;
        this.compilationErrors = response.data.compilationErrors;
    }

    public errorExists(): boolean {
        return !!(this.error || this.compilationErrors);
    }

    public getError(): string {
        if (this.compilationErrors) return 'multiple compilation errors';
        else return this.error!.toString();
    }

    public isPending() {
        return this.status === VerificationStatusEnum.in_progress;
    }

    public isVerificationFailure() {
        return this.status === VerificationStatusEnum.failed;
    }

    public isQueued() {
        return this.status === VerificationStatusEnum.queued;
    }

    public isVerificationSuccess() {
        return this.status === VerificationStatusEnum.successful;
    }
}
