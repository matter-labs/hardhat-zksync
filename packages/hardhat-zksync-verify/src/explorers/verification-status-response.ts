export interface VerificationStatusResponse {
    isPending(): boolean;
    isFailure(): boolean;
    isSuccess(): boolean;
    getError(): string | undefined;
    errorExists(): boolean;
    isOk(): boolean;
}
