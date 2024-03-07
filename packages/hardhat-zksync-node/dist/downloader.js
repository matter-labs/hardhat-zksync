"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCServerDownloader = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("./utils");
const errors_1 = require("./errors");
const constants_1 = require("./constants");
class RPCServerDownloader {
    constructor(binaryDir, tag) {
        this._releaseInfoFile = constants_1.DEFAULT_RELEASE_CACHE_FILE_NAME;
        this._binaryDir = binaryDir;
        this._tag = tag;
        this._releaseInfoFilePath = path_1.default.join(this._binaryDir, this._releaseInfoFile);
    }
    async downloadIfNeeded(force) {
        if (force) {
            const releaseTag = this._isLatestTag()
                ? await (0, utils_1.getLatestRelease)(constants_1.ZKNODE_BIN_OWNER, constants_1.ZKNODE_BIN_REPOSITORY_NAME, constants_1.USER_AGENT, constants_1.DEFAULT_TIMEOUT_MILISECONDS)
                : this._tag;
            await this._download(releaseTag);
            return;
        }
        if (this._isLatestTag()) {
            if (!(await this._isLatestReleaseInfoValid())) {
                const latestTag = await (0, utils_1.getLatestRelease)(constants_1.ZKNODE_BIN_OWNER, constants_1.ZKNODE_BIN_REPOSITORY_NAME, constants_1.USER_AGENT, constants_1.DEFAULT_TIMEOUT_MILISECONDS);
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
            const latestTag = await (0, utils_1.getLatestRelease)(constants_1.ZKNODE_BIN_OWNER, constants_1.ZKNODE_BIN_REPOSITORY_NAME, constants_1.USER_AGENT, constants_1.DEFAULT_TIMEOUT_MILISECONDS);
            if (info && info.latest === latestTag && (await this._isBinaryPathExists(latestTag))) {
                await this._postProcessDownload(latestTag);
                return;
            }
            await this._download(latestTag);
            return;
        }
        if (!(await this._isBinaryPathExists(this._tag))) {
            await this._download(this._tag);
        }
    }
    async _download(tag) {
        const url = await (0, utils_1.getNodeUrl)(constants_1.ZKNODE_BIN_REPOSITORY, tag);
        try {
            console.info(chalk_1.default.yellow(`Downloading era-test-node binary, release: ${tag}`));
            await (0, utils_1.download)(url, await this._createBinaryPath(tag), constants_1.PLUGIN_NAME, tag, 30000);
            await this._postProcessDownload(tag);
            console.info(chalk_1.default.green('era-test-node binary downloaded successfully'));
        }
        catch (error) {
            throw new errors_1.ZkSyncNodePluginError(`Error downloading binary from URL ${url}: ${error.message}`);
        }
    }
    async _isBinaryPathExists(version) {
        return fs_extra_1.default.existsSync(await this.getBinaryPath(version));
    }
    async getBinaryPath(version) {
        return path_1.default.join(this._binaryDir, version || (await this._getReleaseTag()));
    }
    async _createBinaryPath(version) {
        return path_1.default.join(this._binaryDir, version);
    }
    async _postProcessDownload(tag) {
        const binaryPath = await this.getBinaryPath(tag);
        fs_extra_1.default.chmodSync(binaryPath, 0o755);
        if (this._isLatestTag()) {
            await fs_extra_1.default.writeJSON(this._releaseInfoFilePath, { latest: tag });
        }
    }
    async _getReleaseTag() {
        return this._isLatestTag() ? (await this._getLatestReleaseInfo()).latest : this._tag;
    }
    async _isLatestReleaseInfoValid() {
        if (!fs_extra_1.default.existsSync(this._releaseInfoFilePath)) {
            return false;
        }
        const stats = await fs_extra_1.default.stat(this._releaseInfoFilePath);
        const age = new Date().valueOf() - stats.ctimeMs;
        return age < constants_1.DEFAULT_RELEASE_VERSION_INFO_CACHE_PERIOD;
    }
    async _isLatestReleaseInfoExists() {
        return fs_extra_1.default.existsSync(this._releaseInfoFilePath);
    }
    async _getLatestReleaseInfo() {
        if (!(await this._isLatestReleaseInfoExists())) {
            return undefined;
        }
        return await fs_extra_1.default.readJSON(this._releaseInfoFilePath);
    }
    _isLatestTag() {
        return this._tag === 'latest';
    }
}
exports.RPCServerDownloader = RPCServerDownloader;
//# sourceMappingURL=downloader.js.map