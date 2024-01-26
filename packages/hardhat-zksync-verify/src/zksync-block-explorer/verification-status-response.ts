enum VerificationStatusEnum {
    SUCCESSFUL = 'successful',
    FAILED = 'failed',
    QUEUED = 'queued',
    IN_PROGRESS = 'in_progress',
}

export class VerificationStatusResponse {
    public readonly status: VerificationStatusEnum;
    public readonly error: string | undefined;
    public readonly compilationErrors: string[] | undefined;

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
        return this.status === VerificationStatusEnum.IN_PROGRESS;
    }

    public isVerificationFailure() {
        return this.status === VerificationStatusEnum.FAILED;
    }

    public isQueued() {
        return this.status === VerificationStatusEnum.QUEUED;
    }

    public isVerificationSuccess() {
        return this.status === VerificationStatusEnum.SUCCESSFUL;
    }
}
