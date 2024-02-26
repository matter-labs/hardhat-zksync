import path from 'path';
import fse from 'fs-extra';
import chalk from 'chalk';
import { download, getLatestRelease, getNodeUrl } from './utils';
import { ZkSyncNodePluginError } from './errors';
import {
    DEFAULT_RELEASE_CACHE_FILE_NAME,
    DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD,
    DEFAULT_TIMEOUT_MILISECONDS,
    PLUGIN_NAME,
    USER_AGENT,
    ZKNODE_BIN_OWNER,
    ZKNODE_BIN_REPOSITORY,
    ZKNODE_BIN_REPOSITORY_NAME,
} from './constants';

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
            const releaseTag = this._isLatestTag()
                ? await getLatestRelease(
                      ZKNODE_BIN_OWNER,
                      ZKNODE_BIN_REPOSITORY_NAME,
                      USER_AGENT,
                      DEFAULT_TIMEOUT_MILISECONDS,
                  )
                : this._tag;
            await this._download(releaseTag);
            return;
        }

        if (this._isLatestTag()) {
            if (!(await this._isLatestReleaseInfoValid())) {
                const latestTag = await getLatestRelease(
                    ZKNODE_BIN_OWNER,
                    ZKNODE_BIN_REPOSITORY_NAME,
                    USER_AGENT,
                    DEFAULT_TIMEOUT_MILISECONDS,
                );

                if (await this._isBinaryPathExists(latestTag)) {
                    await this._postProcessDownload(latestTag);
                    return;
                }

                await this._download(latestTag);
                return;
            }

            const info = await this._getLatestReleaseInfo();
            if (info && (await this._isBinaryPathExists(info.latest))) {
                return;
            }

            const latestTagForLatestRelease = await getLatestRelease(
                ZKNODE_BIN_OWNER,
                ZKNODE_BIN_REPOSITORY_NAME,
                USER_AGENT,
                DEFAULT_TIMEOUT_MILISECONDS,
            );

            if (
                info &&
                info.latest === latestTagForLatestRelease &&
                (await this._isBinaryPathExists(latestTagForLatestRelease))
            ) {
                await this._postProcessDownload(latestTagForLatestRelease);
                return;
            }
            await this._download(latestTagForLatestRelease);
            return;
        }

        if (!(await this._isBinaryPathExists(this._tag))) {
            await this._download(this._tag);
        }
    }

    private async _download(tag: any): Promise<void> {
        const url: any = await getNodeUrl(ZKNODE_BIN_REPOSITORY, tag);
        try {
            console.info(chalk.yellow(`Downloading era-test-node binary, release: ${tag}`));
            await download(url, await this._createBinaryPath(tag), PLUGIN_NAME, tag, 30000);
            await this._postProcessDownload(tag);
            console.info(chalk.green('era-test-node binary downloaded successfully'));
        } catch (error: any) {
            throw new ZkSyncNodePluginError(`Error downloading binary from URL ${url}: ${error.message}`);
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

        if (this._isLatestTag()) {
            await fse.writeJSON(this._releaseInfoFilePath, { latest: tag });
        }
    }

    private async _getReleaseTag() {
        return this._isLatestTag() ? (await this._getLatestReleaseInfo()).latest : this._tag;
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

    private _isLatestTag() {
        return this._tag === 'latest';
    }
}
