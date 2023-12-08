import path from 'path';
import fse from 'fs-extra';
import { download, getAssetToDownload, getRelease } from './utils';
import { ZkSyncNodePluginError } from './errors';
import {
    DEFAULT_RELEASE_CACHE_FILE_NAME,
    DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD,
    PLUGIN_NAME,
    USER_AGENT,
    ZKNODE_BIN_OWNER,
    ZKNODE_BIN_REPOSITORY_NAME,
} from './constants';
import chalk from 'chalk';

export class RPCServerDownloader {
    private readonly _binaryDir: string;
    private readonly _tag: string;
    private readonly _releaseInfoFile: string = DEFAULT_RELEASE_CACHE_FILE_NAME;
    private readonly _releaseInfoFilePath: string;

    constructor(binaryDir: string, tag: string) {
        this._binaryDir = binaryDir;
        this._tag = tag;
        this._releaseInfoFilePath = path.join(this._binaryDir, this._releaseInfoFile);
    }

    public async downloadIfNeeded(force: boolean): Promise<void> {
        if (force) {
            await this._download(await getRelease(ZKNODE_BIN_OWNER, ZKNODE_BIN_REPOSITORY_NAME, USER_AGENT, this._tag));
            return;
        }

        if (this.isLatestTag()) {
            if (!(await this._isLatestReleaseInfoValid())) {
                const release = await getRelease(ZKNODE_BIN_OWNER, ZKNODE_BIN_REPOSITORY_NAME, USER_AGENT, this._tag);

                if (await this._isBinaryPathExists(release.tag_name)) {
                    await this._postProcessDownload(release.tag_name);
                    return;
                }

                await this._download(release);
                return;
            }

            const info = await this._getLatestReleaseInfo();
            if (info && await this._isBinaryPathExists(info.latest)) {
                return;
            }

            const release = await getRelease(ZKNODE_BIN_OWNER, ZKNODE_BIN_REPOSITORY_NAME, USER_AGENT, this._tag);

            if (info
                && info.latest === release.tag_name
                && await this._isBinaryPathExists(release.tag_name)) {

                await this._postProcessDownload(release.tag_name);
                return;
            }
            await this._download(release);
            return;
        }

        if (!(await this._isBinaryPathExists(this._tag))) {
            await this._download(await getRelease(ZKNODE_BIN_OWNER, ZKNODE_BIN_REPOSITORY_NAME, USER_AGENT, this._tag));
        }
    }

    private async _download(release: any): Promise<void> {
        const assetToDownload: any = await getAssetToDownload(release);
        try {
            console.info(chalk.yellow(`Downloading era-test-node binary, release: ${release.tag_name}`));
            await download(
                assetToDownload.browser_download_url,
                await this._createBinaryPath(release.tag_name),
                PLUGIN_NAME,
                release.tag_name,
                30000
            );
            await this._postProcessDownload(release.tag_name);
            console.info(chalk.green('era-test-node binary downloaded successfully'));
        } catch (error: any) {
            throw new ZkSyncNodePluginError(
                `Error downloading binary from URL ${assetToDownload.browser_download_url}: ${error.message}`
            );
        }
    }

    private async _isBinaryPathExists(version?: string): Promise<boolean> {
        return fse.existsSync(await this.getBinaryPath(version));
    }

    public async getBinaryPath(version?: string): Promise<string> {
        return path.join(this._binaryDir, version || (await this._getReleaseTag()));
    }

    private async _createBinaryPath(version: string): Promise<string> {
        return path.join(this._binaryDir, version);
    }

    private async _postProcessDownload(tag: string): Promise<void> {
        const binaryPath = await this.getBinaryPath(tag);
        fse.chmodSync(binaryPath, 0o755);

        if (this.isLatestTag()) {
            await fse.writeJSON(this._releaseInfoFilePath, { latest: tag });
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

    private async _isLatestReleaseInfoExists() {
        return fse.existsSync(this._releaseInfoFilePath);
    }

    private async _getLatestReleaseInfo() {
        if (!(await this._isLatestReleaseInfoExists())) {
            return undefined;
        }

        return await fse.readJSON(this._releaseInfoFilePath);
    }

    private isLatestTag() {
        return this._tag === 'latest';
    }
}
