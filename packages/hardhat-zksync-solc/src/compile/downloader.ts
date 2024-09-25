import path from 'path';
import fsExtra from 'fs-extra';
import chalk from 'chalk';
import { spawnSync } from 'child_process';

import {
    download,
    getZksolcUrl,
    isURL,
    isVersionInRange,
    saltFromUrl,
    saveDataToFile,
    getLatestRelease,
} from '../utils';
import {
    COMPILER_BINARY_CORRUPTION_ERROR,
    COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR,
    COMPILER_VERSION_RANGE_ERROR,
    COMPILER_VERSION_WARNING,
    DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD,
    ZKSOLC_BIN_REPOSITORY,
    DEFAULT_TIMEOUT_MILISECONDS,
    ZKSOLC_COMPILER_VERSION_MIN_VERSION,
    ZKSOLC_BIN_OWNER,
    ZKSOLC_BIN_REPOSITORY_NAME,
    USER_AGENT,
    ZKSOLC_COMPILER_PATH_VERSION,
    fallbackLatestZkSolcVersion,
} from '../constants';
import { ZkSyncSolcPluginError } from './../errors';

export interface CompilerVersionInfo {
    latest: string;
    minVersion: string;
}

/**
 * This class is responsible for downloading the zksolc binary.
 */
export class ZksolcCompilerDownloader {
    public static async getDownloaderWithVersionValidated(
        version: string,
        configCompilerPath: string,
        compilersDir: string,
    ): Promise<ZksolcCompilerDownloader> {
        if (!ZksolcCompilerDownloader._instance) {
            let compilerVersionInfo = await ZksolcCompilerDownloader._getCompilerVersionInfo(compilersDir);
            if (
                compilerVersionInfo === undefined ||
                (await ZksolcCompilerDownloader._shouldDownloadCompilerVersionInfo(compilersDir))
            ) {
                await ZksolcCompilerDownloader._downloadCompilerVersionInfo(compilersDir);
                compilerVersionInfo = await ZksolcCompilerDownloader._getCompilerVersionInfo(compilersDir);
            }

            if (compilerVersionInfo === undefined) {
                throw new ZkSyncSolcPluginError(COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR);
            }

            if (version !== ZKSOLC_COMPILER_PATH_VERSION && configCompilerPath) {
                throw new ZkSyncSolcPluginError(
                    `When a compiler path is provided, specifying a version of the zksolc compiler in Hardhat is not allowed. Please omit the version and try again.`,
                );
            }

            if (version === ZKSOLC_COMPILER_PATH_VERSION && !configCompilerPath) {
                throw new ZkSyncSolcPluginError(
                    `The zksolc compiler path is not specified for local or remote origin.`,
                );
            }

            if (version === 'latest' || version === compilerVersionInfo.latest) {
                version = compilerVersionInfo.latest;
            } else if (version !== ZKSOLC_COMPILER_PATH_VERSION && !isVersionInRange(version, compilerVersionInfo)) {
                throw new ZkSyncSolcPluginError(
                    COMPILER_VERSION_RANGE_ERROR(version, compilerVersionInfo.minVersion, compilerVersionInfo.latest),
                );
            } else if (version !== ZKSOLC_COMPILER_PATH_VERSION) {
                console.info(chalk.yellow(COMPILER_VERSION_WARNING(version, compilerVersionInfo.latest)));
            }

            ZksolcCompilerDownloader._instance = new ZksolcCompilerDownloader(
                version,
                configCompilerPath,
                compilersDir,
            );
        }

        return ZksolcCompilerDownloader._instance;
    }

    private static _instance: ZksolcCompilerDownloader;
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

        // Add mock extension '0' so windowns can run the binary
        return path.join(
            this._compilersDirectory,
            'zksolc',
            `zksolc-${this._configCompilerPath ? `remote` : `v${this._version}`}${salt ? '-' : ''}${salt}${
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

        return age > ZksolcCompilerDownloader.compilerVersionInfoCachePeriodMs;
    }

    private static _getCompilerVersionInfoPath(compilersDir: string): string {
        return path.join(compilersDir, 'zksolc', 'compilerVersionInfo.json');
    }

    public async downloadCompiler(): Promise<void> {
        let compilerVersionInfo = await ZksolcCompilerDownloader._getCompilerVersionInfo(this._compilersDirectory);

        if (
            compilerVersionInfo === undefined ||
            (await ZksolcCompilerDownloader._shouldDownloadCompilerVersionInfo(this._compilersDirectory))
        ) {
            await ZksolcCompilerDownloader._downloadCompilerVersionInfo(this._compilersDirectory);
            compilerVersionInfo = await ZksolcCompilerDownloader._getCompilerVersionInfo(this._compilersDirectory);
        }

        if (compilerVersionInfo === undefined) {
            throw new ZkSyncSolcPluginError(COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR);
        }

        if (!this._configCompilerPath && !isVersionInRange(this._version, compilerVersionInfo)) {
            throw new ZkSyncSolcPluginError(
                COMPILER_VERSION_RANGE_ERROR(this._version, compilerVersionInfo.minVersion, compilerVersionInfo.latest),
            );
        }

        try {
            console.info(
                chalk.yellow(
                    `Downloading zksolc ${!this._configCompilerPath ? this._version : 'from the remote origin'}`,
                ),
            );
            await this._downloadCompiler();
            console.info(
                chalk.green(
                    `zksolc ${
                        !this._configCompilerPath ? `version ${this._version}` : 'from the remote origin'
                    } successfully downloaded`,
                ),
            );
        } catch (e: any) {
            throw new ZkSyncSolcPluginError(e.message.split('\n')[0]);
        }

        await this._postProcessCompilerDownload();
        await this._verifyCompilerAndSetVersionIfNeeded();
    }

    /*
        Currently, the compiler version info is pulled from the constants and not from the remote origin, in the future we will allow it to be downloaded from CDN-a.
        We are currently limited in that each new version requires an update of the plugin version.
    */
    private static async _downloadCompilerVersionInfo(compilersDir: string): Promise<void> {
        const latestRelease = await getLatestRelease(
            ZKSOLC_BIN_OWNER,
            ZKSOLC_BIN_REPOSITORY_NAME,
            USER_AGENT,
            fallbackLatestZkSolcVersion,
        );

        const releaseToSave = {
            latest: latestRelease,
            minVersion: ZKSOLC_COMPILER_VERSION_MIN_VERSION,
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
            if (!this._isCompilerPathURL) {
                const fallbackUrl = this._getCompilerUrl(false);
                await this._attemptDownload(fallbackUrl, downloadPath);
            }
        }
        return downloadPath;
    }

    private _getCompilerUrl(useGithubRelease: boolean): string {
        if (this._isCompilerPathURL) {
            return this._configCompilerPath;
        }
        return getZksolcUrl(ZKSOLC_BIN_REPOSITORY, this._version, useGithubRelease);
    }

    private async _attemptDownload(url: string, downloadPath: string): Promise<void> {
        return download(url, downloadPath, USER_AGENT, DEFAULT_TIMEOUT_MILISECONDS);
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
            throw new ZkSyncSolcPluginError(COMPILER_BINARY_CORRUPTION_ERROR(compilerPath));
        }

        if (this._configCompilerPath) {
            this._version = version!;
        }
    }
}
