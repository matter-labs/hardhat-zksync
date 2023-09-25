export class RPCServerBinaryDownloader {
    private readonly _binaryPath: string;

    constructor(binaryPath: string) {
        this._binaryPath = binaryPath;
    }

    public async isBinaryDownloaded(): Promise<boolean> {
        // Check if the binary file exists at the _binaryPath location.
        return false;
    }

    public async download(): Promise<void> {
        // Download the binary file to the _binaryPath location.
    }

    public get binaryPath(): string {
        return this._binaryPath;
    }
}