import path from 'path';
import fse from 'fs-extra';
import { download, getAssetToDownload, getRelease } from './utils';
import { ZkSyncNodePluginError } from './errors';
import {
    DEFAULT_RELEASE_CACHE_FILE_NAME,
    DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD,
    PLUGIN_NAME,
    ZKNODE_BIN_OWNER,
    ZKNODE_BIN_REPOSITORY_NAME,
} from './constants';
import chalk from 'chalk';

export class RPCServerDownloader {
    private readonly _binaryDir: string;
    private readonly _tag: string;
    private readonly _releaseInfoFile: string = DEFAULT_RELEASE_CACHE_FILE_NAME;
    private readonly _releaseInfoFilePath: string;

    constructor(binaryDir: string, tag: string, releaseInfoFile?: string) {
        this._binaryDir = binaryDir;
        this._tag = tag;
        this._releaseInfoFile = releaseInfoFile || this._releaseInfoFile;
        this._releaseInfoFilePath = path.join(this._binaryDir, this._releaseInfoFile);
    }

    public async isDownloaded(): Promise<boolean> {
        return this.isLatestTag() ? await this._isLatestDownloaded() : await this._isBinaryPathExists();
    }

    private async _isLatestDownloaded(): Promise<boolean | PromiseLike<boolean>> {
        return (await this._isLatestReleaseInfoValid()) && (await this._isBinaryPathExists());
    }

    public async download(): Promise<void> {
        const release = await getRelease(ZKNODE_BIN_OWNER, ZKNODE_BIN_REPOSITORY_NAME, PLUGIN_NAME, this._tag);
        const assetToDownload: any = await getAssetToDownload(release);
        try {
            console.info(chalk.yellow(`Downloading era-test-node binary, release: ${release.tag_name}`));
            await download(
                assetToDownload.browser_download_url,
                await this.createBinaryPath(release.tag_name),
                PLUGIN_NAME,
                release.tag_name,
                30000
            );
            await this._postProcessDownload(release);
            console.info(chalk.green('era-test-node binary downloaded successfully'));
        } catch (error: any) {
            throw new ZkSyncNodePluginError(
                `Error downloading binary from URL ${assetToDownload.browser_download_url}: ${error.message}`
            );
        }
    }

    private async _isBinaryPathExists(): Promise<boolean> {
        return fse.existsSync(await this.getBinaryPath());
    }

    public async getBinaryPath(version?: string): Promise<string> {
        return path.join(this._binaryDir, version || (await this._getReleaseTag()));
    }

    public async createBinaryPath(version: string): Promise<string> {
        return path.join(this._binaryDir, version);
    }

    private async _postProcessDownload(release: any): Promise<void> {
        const binaryPath = await this.getBinaryPath(release.tag_name);
        fse.chmodSync(binaryPath, 0o755);

        if (this.isLatestTag()) {
            await fse.writeJSON(this._releaseInfoFilePath, { latest: release.tag_name });
        }
    }

    private async _getReleaseTag() {
        return this.isLatestTag() ? (await this._getLatestReleaseInfo()).latest : this._tag;
    }

    private async _isLatestReleaseInfoValid() {
        if (!fse.existsSync(this._releaseInfoFilePath)) {
            return false;
        }

        const stats = await fse.stat(this._releaseInfoFilePath);
        const age = new Date().valueOf() - stats.ctimeMs;

        return age < DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD;
    }

    private async _getLatestReleaseInfo() {
        return await fse.readJSON(this._releaseInfoFilePath);
    }

    private isLatestTag() {
        return this._tag === 'latest';
    }
}
