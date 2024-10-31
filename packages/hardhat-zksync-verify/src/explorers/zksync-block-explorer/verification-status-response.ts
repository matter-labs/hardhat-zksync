import { VerificationStatusResponse } from '../verification-status-response';

export class ZksyncBlockExplorerResponse implements VerificationStatusResponse {
    public readonly status: string;
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
        return this.status === 'in_progress' || this.status === 'queued';
    }

    public isFailure() {
        return this.status === 'failed';
    }

    public isOk() {
        return this.status === 'successful';
    }

    public isSuccess() {
        return this.isOk();
    }
}
