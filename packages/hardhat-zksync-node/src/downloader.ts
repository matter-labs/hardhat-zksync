import path from 'path';
import fse from 'fs-extra';
import chalk from 'chalk';
import { download, ensureDirectory, getAllTags, getLatestRelease, getNodeUrl, resolveTag } from './utils';
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
    private readonly _tagRegex: RegExp = /^\d+\.\d+\.(\d+)(-[A-Za-z0-9.]+)?$|^\d+\.\d+\.\*(?!-)[A-Za-z0-9.]*$/;
    private readonly _binaryDir: string;
    private _tag?: string;
    private readonly _initialTag: string;
    private readonly _tagsInfoFile: string = DEFAULT_RELEASE_CACHE_FILE_NAME;
    private readonly _tagsInfoFilePath: string;
    private binaryPath?: string;

    constructor(binaryDir: string, initialTag: string) {
        this._binaryDir = binaryDir;
        if (!this._tagRegex.test(initialTag) && initialTag !== 'latest') {
            throw new ZkSyncNodePluginError(`Invalid tag format: ${initialTag}`);
        }
        this._initialTag = initialTag;
        this._tagsInfoFilePath = path.join(this._binaryDir, this._tagsInfoFile);
    }

    public async downloadIfNeeded(force: boolean, binaryPath?: string): Promise<void> {
        if (binaryPath) {
            this.binaryPath = binaryPath;
            return;
        }

        if (!(await this._isTagsInfoValid()) || force) {
            await this._downloadTagInfo();
        }

        const tagsInfo = await this._getTagsInfo();
        this._tag = resolveTag(tagsInfo.tags, tagsInfo.latest, this._initialTag);

        if (force) {
            await this._download(this._tag);
            return;
        }

        if (await this._isBinaryPathExists(this._tag)) {
            await this._postProcessDownload(this._tag);
            return;
        }

        await this._download(this._tag);
    }

    private async _download(tag: any): Promise<void> {
        const url: any = await getNodeUrl(ZKNODE_BIN_REPOSITORY, tag);
        try {
            console.info(chalk.yellow(`Downloading anvil-zksync binary, release: ${tag}`));
            await download(url, await this._createBinaryPath(tag), PLUGIN_NAME, tag, 30000);
            await this._postProcessDownload(tag);
            console.info(chalk.green('anvil-zksync binary downloaded successfully'));
        } catch (error: any) {
            throw new ZkSyncNodePluginError(`Error downloading binary from URL ${url}: ${error.message}`);
        }
    }

    private async _isBinaryPathExists(tag?: string): Promise<boolean> {
        return fse.existsSync(await this.getBinaryPath(tag));
    }

    public async getBinaryPath(tag?: string): Promise<string> {
        if (this.binaryPath) {
            return this.binaryPath;
        }

        if (!tag && !this._tag) {
            throw new ZkSyncNodePluginError('Tag is not set');
        }
        return path.join(this._binaryDir, tag || this._tag!);
    }

    private async _createBinaryPath(version: string): Promise<string> {
        return path.join(this._binaryDir, version);
    }

    private async _postProcessDownload(tag: string): Promise<void> {
        const binaryPath = await this.getBinaryPath(tag);
        fse.chmodSync(binaryPath, 0o755);
    }

    private async _isTagsInfoValid() {
        if (!(await this._isTagsInfoExists())) {
            return false;
        }

        const stats = await fse.stat(this._tagsInfoFilePath);
        const age = new Date().valueOf() - stats.ctimeMs;

        return age < DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD;
    }

    private async _isTagsInfoExists() {
        return fse.existsSync(this._tagsInfoFilePath);
    }

    private async _getTagsInfo() {
        if (!(await this._isTagsInfoValid())) {
            return undefined;
        }

        return await fse.readJSON(this._tagsInfoFilePath);
    }

    private async _downloadTagInfo() {
        const allTags = await getAllTags(
            ZKNODE_BIN_OWNER,
            ZKNODE_BIN_REPOSITORY_NAME,
            USER_AGENT,
            DEFAULT_TIMEOUT_MILISECONDS,
        );
        const latestTag = await getLatestRelease(
            ZKNODE_BIN_OWNER,
            ZKNODE_BIN_REPOSITORY_NAME,
            USER_AGENT,
            DEFAULT_TIMEOUT_MILISECONDS,
        );
        await ensureDirectory(this._tagsInfoFilePath, { mode: 0o755 });
        await fse.writeJSON(this._tagsInfoFilePath, { tags: allTags, latest: latestTag });
    }
}
