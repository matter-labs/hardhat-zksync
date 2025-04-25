import path from 'path';
import fsExtra from 'fs-extra';
import chalk from 'chalk';
import { spawnSync } from 'child_process';

import {
    download,
    getLatestRelease,
    getZkvyperUrl,
    isURL,
    isVersionForDeprecation,
    isVersionInRange,
    saltFromUrl,
    saveDataToFile,
} from '../utils';
import {
    COMPILER_BINARY_CORRUPTION_ERROR,
    COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR,
    COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR,
    COMPILER_VERSION_RANGE_ERROR,
    COMPILER_VERSION_WARNING,
    DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD,
    DEFAULT_TIMEOUT_MILISECONDS,
    USER_AGENT,
    ZKVYPER_BIN_OWNER,
    ZKVYPER_BIN_REPOSITORY,
    ZKVYPER_BIN_REPOSITORY_NAME,
    ZKVYPER_COMPILER_PATH_VERSION,
    ZKVYPER_COMPILER_VERSION_MIN_VERSION,
    COMPILER_ZKVYPER_LATEST_DEPRECATION,
    COMPILER_ZKVYPER_DEPRECATION_FOR_VYPER_VERSION,
} from '../constants';
import { ZkSyncVyperPluginError } from '../errors';

export interface CompilerVersionInfo {
    latest: string;
    minVersion: string;
}

/**
 * This class is responsible for downloading the zkvyper binary.
 */
export class ZkVyperCompilerDownloader {
    public static async getDownloaderWithVersionValidated(
        version: string,
        configCompilerPath: string,
        compilersDir: string,
    ): Promise<ZkVyperCompilerDownloader> {
        if (!ZkVyperCompilerDownloader._instance) {
            let compilerVersionInfo = await ZkVyperCompilerDownloader._getCompilerVersionInfo(compilersDir);
            if (
                compilerVersionInfo === undefined ||
                (await ZkVyperCompilerDownloader._shouldDownloadCompilerVersionInfo(compilersDir))
            ) {
                try {
                    await ZkVyperCompilerDownloader._downloadCompilerVersionInfo(compilersDir);
                } catch (e: any) {
                    throw new ZkSyncVyperPluginError(COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR);
                }
                compilerVersionInfo = await ZkVyperCompilerDownloader._getCompilerVersionInfo(compilersDir);
            }

            if (compilerVersionInfo === undefined) {
                throw new ZkSyncVyperPluginError(COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR);
            }

            if (version !== ZKVYPER_COMPILER_PATH_VERSION && configCompilerPath) {
                throw new ZkSyncVyperPluginError(
                    `When a compiler path is provided, specifying a version of the zkvyper compiler in Hardhat is not allowed. Please omit the version and try again.`,
                );
            }

            if (version === ZKVYPER_COMPILER_PATH_VERSION && !configCompilerPath) {
                throw new ZkSyncVyperPluginError(
                    `The zkvyper compiler path is not specified for local or remote origin.`,
                );
            }

            if (version === 'latest') {
                console.info(chalk.yellow(COMPILER_ZKVYPER_LATEST_DEPRECATION));
            }

            if (version !== 'latest' && version !== ZKVYPER_COMPILER_PATH_VERSION && isVersionForDeprecation(version)) {
                console.info(chalk.yellow(COMPILER_ZKVYPER_DEPRECATION_FOR_VYPER_VERSION(version)));
            }

            if (version === 'latest' || version === compilerVersionInfo.latest) {
                version = compilerVersionInfo.latest;
            } else if (version !== ZKVYPER_COMPILER_PATH_VERSION && !isVersionInRange(version, compilerVersionInfo)) {
                throw new ZkSyncVyperPluginError(
                    COMPILER_VERSION_RANGE_ERROR(version, compilerVersionInfo.minVersion, compilerVersionInfo.latest),
                );
            } else if (version !== ZKVYPER_COMPILER_PATH_VERSION) {
                console.info(chalk.yellow(COMPILER_VERSION_WARNING(version, compilerVersionInfo.latest)));
            }

            ZkVyperCompilerDownloader._instance = new ZkVyperCompilerDownloader(
                version,
                configCompilerPath,
                compilersDir,
            );
        }

        return ZkVyperCompilerDownloader._instance;
    }

    private static _instance: ZkVyperCompilerDownloader;
    public static compilerVersionInfoCachePeriodMs = DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD;
    private _isCompilerPathURL: boolean;
    /**
     * Use `getDownloaderWithVersionValidated` to create an instance of this class.
     */
    private constructor(
        private _version: string,
        private readonly _configCompilerPath: string,
        private readonly _compilersDirectory: string,
    ) {
        this._isCompilerPathURL = isURL(_configCompilerPath);
    }

    public getVersion(): string {
        return this._version;
    }

    public getCompilerPath(): string {
        let salt = '';

        if (this._isCompilerPathURL) {
            // hashed url used as a salt to avoid name collisions
            salt = saltFromUrl(this._configCompilerPath);
        } else if (this._configCompilerPath) {
            return this._configCompilerPath;
        }

        // Add mock extension '0' to the path so windows can execute it
        return path.join(
            this._compilersDirectory,
            'zkvyper',
            `zkvyper-${this._configCompilerPath ? `remote` : `v${this._version}`}${salt ? '-' : ''}${salt}${
                this._configCompilerPath ? '.0' : ''
            }`,
        );
    }

    public async isCompilerDownloaded(): Promise<boolean> {
        if (this._configCompilerPath && !this._isCompilerPathURL) {
            await this._verifyCompilerAndSetVersionIfNeeded();
            return true;
        }

        if (this._configCompilerPath && this._isCompilerPathURL) {
            const compilerPathFromUrl = this.getCompilerPath();
            if (await fsExtra.pathExists(compilerPathFromUrl)) {
                await this._verifyCompilerAndSetVersionIfNeeded();
                return true;
            }
            return false;
        }

        const compilerPath = this.getCompilerPath();
        return fsExtra.pathExists(compilerPath);
    }

    private static async _shouldDownloadCompilerVersionInfo(compilersDir: string): Promise<boolean> {
        const compilerVersionInfoPath = this._getCompilerVersionInfoPath(compilersDir);
        if (!(await fsExtra.pathExists(compilerVersionInfoPath))) {
            return true;
        }

        const stats = await fsExtra.stat(compilerVersionInfoPath);
        const age = new Date().valueOf() - stats.ctimeMs;

        return age > ZkVyperCompilerDownloader.compilerVersionInfoCachePeriodMs;
    }

    private static _getCompilerVersionInfoPath(compilersDir: string): string {
        return path.join(compilersDir, 'zkvyper', 'compilerVersionInfo.json');
    }

    public async downloadCompiler(): Promise<void> {
        let compilerVersionInfo = await ZkVyperCompilerDownloader._getCompilerVersionInfo(this._compilersDirectory);

        if (
            compilerVersionInfo === undefined ||
            (await ZkVyperCompilerDownloader._shouldDownloadCompilerVersionInfo(this._compilersDirectory))
        ) {
            try {
                await ZkVyperCompilerDownloader._downloadCompilerVersionInfo(this._compilersDirectory);
            } catch (e: any) {
                throw new ZkSyncVyperPluginError(COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR);
            }

            compilerVersionInfo = await ZkVyperCompilerDownloader._getCompilerVersionInfo(this._compilersDirectory);
        }

        if (compilerVersionInfo === undefined) {
            throw new ZkSyncVyperPluginError(COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR);
        }
        if (!this._configCompilerPath && !isVersionInRange(this._version, compilerVersionInfo)) {
            throw new ZkSyncVyperPluginError(
                COMPILER_VERSION_RANGE_ERROR(this._version, compilerVersionInfo.minVersion, compilerVersionInfo.latest),
            );
        }

        try {
            console.info(
                chalk.yellow(
                    `Downloading zkvyper ${!this._configCompilerPath ? this._version : 'from the remote origin'}`,
                ),
            );
            await this._downloadCompiler();
            console.info(
                chalk.green(
                    `zkvyper ${
                        !this._configCompilerPath ? `version ${this._version}` : 'from the remote origin'
                    } successfully downloaded`,
                ),
            );
        } catch (e: any) {
            throw new ZkSyncVyperPluginError(e.message.split('\n')[0]);
        }

        await this._postProcessCompilerDownload();
        await this._verifyCompilerAndSetVersionIfNeeded();
    }

    private static async _downloadCompilerVersionInfo(compilersDir: string): Promise<void> {
        const latestRelease = await getLatestRelease(ZKVYPER_BIN_OWNER, ZKVYPER_BIN_REPOSITORY_NAME, USER_AGENT);

        const releaseToSave = {
            latest: latestRelease,
            minVersion: ZKVYPER_COMPILER_VERSION_MIN_VERSION,
        };
        const savePath = this._getCompilerVersionInfoPath(compilersDir);
        await saveDataToFile(releaseToSave, savePath);
    }

    private async _downloadCompiler(): Promise<string> {
        const downloadPath = this.getCompilerPath();

        const url = this._getCompilerUrl(true);
        try {
            await this._attemptDownload(url, downloadPath);
        } catch (e: any) {
            if (!isURL(this._configCompilerPath)) {
                const fallbackUrl = this._getCompilerUrl(false);
                await this._attemptDownload(fallbackUrl, downloadPath);
            }
        }

        return downloadPath;
    }

    private _getCompilerUrl(useGithubRelease: boolean): string {
        if (isURL(this._configCompilerPath)) {
            return this._configCompilerPath;
        }

        return getZkvyperUrl(ZKVYPER_BIN_REPOSITORY, this._version, useGithubRelease);
    }

    private async _attemptDownload(url: string, downloadPath: string): Promise<void> {
        return download(url, downloadPath, 'hardhat-zksync-zkvyper', this._version, DEFAULT_TIMEOUT_MILISECONDS);
    }

    private static async _readCompilerVersionInfo(compilerVersionInfoPath: string): Promise<CompilerVersionInfo> {
        return fsExtra.readJSON(compilerVersionInfoPath);
    }

    private static async _getCompilerVersionInfo(compilersDir: string): Promise<CompilerVersionInfo | undefined> {
        const compilerVersionInfoPath = this._getCompilerVersionInfoPath(compilersDir);
        if (!(await fsExtra.pathExists(compilerVersionInfoPath))) {
            return undefined;
        }
        return await this._readCompilerVersionInfo(compilerVersionInfoPath);
    }

    private async _postProcessCompilerDownload(): Promise<void> {
        const compilerPath = this.getCompilerPath();
        fsExtra.chmodSync(compilerPath, 0o755);
    }

    private async _verifyCompilerAndSetVersionIfNeeded(): Promise<void> {
        const compilerPath = this.getCompilerPath();

        const versionOutput = spawnSync(compilerPath, ['--version']);
        const version = versionOutput.stdout
            ?.toString()
            .match(/\d+\.\d+\.\d+/)
            ?.toString();

        if (versionOutput.status !== 0 || version === null) {
            throw new ZkSyncVyperPluginError(COMPILER_BINARY_CORRUPTION_ERROR(compilerPath));
        }

        if (this._configCompilerPath) {
            this._version = version!;
        }
    }
}
