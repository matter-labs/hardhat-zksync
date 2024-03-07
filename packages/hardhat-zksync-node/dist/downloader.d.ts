export declare class RPCServerDownloader {
    private readonly _binaryDir;
    private readonly _tag;
    private readonly _releaseInfoFile;
    private readonly _releaseInfoFilePath;
    constructor(binaryDir: string, tag: string);
    downloadIfNeeded(force: boolean): Promise<void>;
    private _download;
    private _isBinaryPathExists;
    getBinaryPath(version?: string): Promise<string>;
    private _createBinaryPath;
    private _postProcessDownload;
    private _getReleaseTag;
    private _isLatestReleaseInfoValid;
    private _isLatestReleaseInfoExists;
    private _getLatestReleaseInfo;
    private _isLatestTag;
}
//# sourceMappingURL=downloader.d.ts.map