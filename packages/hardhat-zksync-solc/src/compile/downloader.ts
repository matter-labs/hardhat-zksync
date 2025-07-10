import path from 'path';
import fsExtra from 'fs-extra';
import chalk from 'chalk';
import { spawnSync } from 'child_process';

import { download, getZksolcUrl, isURL, saltFromUrl, isVersionForDeprecation } from '../utils';
import {
    COMPILER_BINARY_CORRUPTION_ERROR,
    ZKSOLC_BIN_REPOSITORY,
    DEFAULT_TIMEOUT_MILISECONDS,
    USER_AGENT,
    ZKSOLC_COMPILER_PATH_VERSION,
    COMPILER_ZKSOLC_LATEST_DEPRECATION,
    COMPILER_ZKSOLC_DEPRECATION_FOR_SOLC_VERSION,
    DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD,
} from '../constants';
import { ZkSyncSolcPluginError } from './../errors';

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

            if (version === 'latest') {
                throw new ZkSyncSolcPluginError(COMPILER_ZKSOLC_LATEST_DEPRECATION);
            }

            if (version !== 'latest' && version !== ZKSOLC_COMPILER_PATH_VERSION && isVersionForDeprecation(version)) {
                throw new ZkSyncSolcPluginError(COMPILER_ZKSOLC_DEPRECATION_FOR_SOLC_VERSION(version));
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

    public async downloadCompiler(): Promise<void> {
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

    private async _downloadCompiler(): Promise<string> {
        const downloadPath = this.getCompilerPath();

        const url = this._getCompilerUrl();
        try {
            await this._attemptDownload(url, downloadPath);
        } catch (e: any) {
            if (!this._isCompilerPathURL) {
                await this._attemptDownload(url, downloadPath);
            }
        }
        return downloadPath;
    }

    private _getCompilerUrl(): string {
        if (this._isCompilerPathURL) {
            return this._configCompilerPath;
        }
        return getZksolcUrl(ZKSOLC_BIN_REPOSITORY, this._version);
    }

    private async _attemptDownload(url: string, downloadPath: string): Promise<void> {
        return download(url, downloadPath, USER_AGENT, DEFAULT_TIMEOUT_MILISECONDS);
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
