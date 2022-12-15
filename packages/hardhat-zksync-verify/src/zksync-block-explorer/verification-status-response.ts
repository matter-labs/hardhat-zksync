enum VerificationStatusEnum {
    successful = 'successful',
    failed = 'failed',
    queued = 'queued',
    inProgress = 'in_progress',
}

export class VerificationStatusResponse {
    public readonly status: VerificationStatusEnum;
    public readonly error: string | undefined;
    public readonly compilationErrors: Array<string> | undefined;

    constructor(response: any) {
        this.status = response.data.status;
        this.error = response.data.error;
        this.compilationErrors = response.data.compilationErrors;
    }

    public errorExists(): boolean {
        return !!(this.error || this.compilationErrors);
    }

    public getError(): string {
        let errors = '';

        if (this.error) {
            errors += this.error;
        }

        if (this.compilationErrors) {
            errors += this.compilationErrors.join('\n');
        }

        return errors;
    }

    public isPending() {
        return this.status === VerificationStatusEnum.inProgress;
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
