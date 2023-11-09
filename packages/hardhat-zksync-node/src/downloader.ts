import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { download, getAssetToDownload, getRelease } from './utils';
import { ZkSyncNodePluginError } from './errors';
import { DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD, PLUGIN_NAME, ZKNODE_BIN_OWNER, ZKNODE_BIN_REPOSITORY_NAME } from './constants';
import chalk from 'chalk';

export class RPCServerDownloader {
    private readonly _binaryDir: string;
    private readonly _tag: string;
    private readonly _releaseInfoFile: string = 'listNode.json';
    private readonly _releaseInfoFilePath: string;

    constructor(binaryDir: string, tag: string, releaseInfoFile?: string) {
        this._binaryDir = binaryDir;
        this._tag = tag;
        this._releaseInfoFile = releaseInfoFile || this._releaseInfoFile;
        this._releaseInfoFilePath = path.join(this._binaryDir, this._releaseInfoFile);
    }

    public async isDownloaded(): Promise<boolean> {
        return await this._isReleaseInfoValid() && fs.existsSync(await this.getBinaryPath());
    }

    public async download(): Promise<void> {
        const release = await getRelease(ZKNODE_BIN_OWNER, ZKNODE_BIN_REPOSITORY_NAME, PLUGIN_NAME, this._tag);
        const assetToDownload: any = await getAssetToDownload(release);
        try {
            console.info(chalk.yellow(`Downloading era-test-node binary, release: ${release.tag_name}`));
            await download(assetToDownload.browser_download_url, await this.createBinaryPath(release.tag_name), PLUGIN_NAME, release.tag_name, 30000);
            await this._postProcessDownload(release);

            console.info(chalk.green('era-test-node binary downloaded successfully'));
        } catch (error: any) {
            throw new ZkSyncNodePluginError(`Error downloading binary from URL ${assetToDownload.browser_download_url}: ${error.message}`);
        }
    }

    public async getBinaryPath(): Promise<string> {
        return path.join(this._binaryDir, await this._getLatestRelease());
    }

    public async createBinaryPath(version: string): Promise<string> {
        return path.join(this._binaryDir, version);
    }

    private async _postProcessDownload(release: any): Promise<void> {
        const binaryPath = await this.getBinaryPath();
        fse.chmodSync(binaryPath, 0o755);

        let nodeReleaseInfo = await this._getNodeReleaseInfo();

        if (!this.isLatestTag()) {
            if (!nodeReleaseInfo.specified.includes(this._tag)) {
                nodeReleaseInfo.specified.push(this._tag);
            }
        } else {
            nodeReleaseInfo.latest = release.tag_name;
        }

        await fse.writeJSON(this._releaseInfoFilePath, nodeReleaseInfo);
    }

    private async _isReleaseInfoValid() {
        if (!fse.existsSync(this._releaseInfoFilePath)) {
            return false;
        }

        const nodeReleaseInfo = await this._getNodeReleaseInfo();

        if (!this.isLatestTag()) {
            return !nodeReleaseInfo.specified.includes(this._tag) && fse.existsSync(`${this._binaryDir}/${this._tag}.json`);
        }

        if (nodeReleaseInfo.latest === '') {
            return false;
        }

        const stats = await fse.stat(this._releaseInfoFilePath);
        const age = new Date().valueOf() - stats.ctimeMs;

        return age < DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD;
    }

    private async _getNodeReleaseInfo() {
        if (!fse.existsSync(this._releaseInfoFilePath)) {
            return { specified: [], latest: '' };
        }

        return await fse.readJSON(this._releaseInfoFilePath);
    }

    private async _getLatestRelease() {
        const nodeReleaseInfo = await this._getNodeReleaseInfo();
        return this.isLatestTag() ? nodeReleaseInfo.latest : this._tag;
    }

    private isLatestTag() {
        return this._tag === 'latest';
    }
}
