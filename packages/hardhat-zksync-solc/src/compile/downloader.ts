import path from "path";
import fsExtra from "fs-extra";
import chalk from "chalk";
import { spawnSync } from 'child_process';

import { download } from 'hardhat/internal/util/download';
import { Mutex } from 'hardhat/internal/vendor/await-semaphore';

import { getZksolcUrl, isURL, isVersionInRange, saltFromUrl } from "../utils";
import { 
    COMPILER_BINARY_CORRUPTION_ERROR, 
    COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR, 
    COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR, 
    COMPILER_VERSION_RANGE_ERROR, 
    COMPILER_VERSION_WARNING, 
    DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD, 
    ZKSOLC_BIN_REPOSITORY, 
    ZKSOLC_BIN_VERSION_INFO 
} from "../constants";
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
            if (compilerVersionInfo === undefined || (await ZksolcCompilerDownloader._shouldDownloadCompilerVersionInfo(compilersDir))) {
                try {
                    await ZksolcCompilerDownloader._downloadCompilerVersionInfo(compilersDir);
                } catch (e: any) {
                    throw new ZkSyncSolcPluginError(COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR);
                }
                compilerVersionInfo = await ZksolcCompilerDownloader._getCompilerVersionInfo(compilersDir);
            }
            
            if (compilerVersionInfo === undefined) {
                throw new ZkSyncSolcPluginError(COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR);
            }
            
            if (version === 'latest' || version === compilerVersionInfo.latest) {
                version = compilerVersionInfo.latest;
            } else if (!isVersionInRange(version, compilerVersionInfo)) {
                throw new ZkSyncSolcPluginError(COMPILER_VERSION_RANGE_ERROR(version, compilerVersionInfo.minVersion, compilerVersionInfo.latest));
            } else {
                console.info(chalk.yellow(COMPILER_VERSION_WARNING(version, compilerVersionInfo.latest)));
            };

            ZksolcCompilerDownloader._instance = new ZksolcCompilerDownloader(version, configCompilerPath, compilersDir);
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

        return path.join(this._compilersDirectory, 'zksolc', `zksolc-v${this._version}${salt ? '-' : ''}${salt}`);
    }

    public async isCompilerDownloaded(): Promise<boolean> {        
        if (this._configCompilerPath && !this._isCompilerPathURL) {
            await this._verifyCompiler();
            return true;
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

        if (compilerVersionInfo === undefined || (await ZksolcCompilerDownloader._shouldDownloadCompilerVersionInfo(this._compilersDirectory))) {
            try {
                await ZksolcCompilerDownloader._downloadCompilerVersionInfo(this._compilersDirectory);
            } catch (e: any) {
                throw new ZkSyncSolcPluginError(COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR)
            }

            compilerVersionInfo = await ZksolcCompilerDownloader._getCompilerVersionInfo(this._compilersDirectory);
        }

        if (compilerVersionInfo === undefined) {
            throw new ZkSyncSolcPluginError(COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR);
        }
        if (!isVersionInRange(this._version, compilerVersionInfo)) {
            throw new ZkSyncSolcPluginError(COMPILER_VERSION_RANGE_ERROR(this._version, compilerVersionInfo.minVersion, compilerVersionInfo.latest));
        }

        try {
            console.info(chalk.yellow(`Downloading zksolc ${this._version}`));
            await this._downloadCompiler();
            console.info(chalk.green(`zksolc version ${this._version} successfully downloaded`));
        } catch (e: any) {
            throw new ZkSyncSolcPluginError(e.message.split('\n')[0]);
        }

        await this._postProcessCompilerDownload();
        await this._verifyCompiler();
    }

    private static async _downloadCompilerVersionInfo(compilersDir: string): Promise<void> {
        const url = `${ZKSOLC_BIN_VERSION_INFO}/version.json`;
        const downloadPath = this._getCompilerVersionInfoPath(compilersDir);

        await download(url, downloadPath, 30000);
    }

    private async _downloadCompiler(): Promise<string> {
        let url = this._configCompilerPath;
        if (!this._isCompilerPathURL) {
            url = getZksolcUrl(ZKSOLC_BIN_REPOSITORY, this._version);
        }

        const downloadPath = this.getCompilerPath();
        await download(url, downloadPath, 30000);
        return downloadPath;
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

    private async _verifyCompiler(): Promise<void> {
        const compilerPath = this.getCompilerPath();

        const versionOutput = spawnSync(compilerPath, ['--version']);
        const version = versionOutput.stdout
            ?.toString()
            .match(/\d+\.\d+\.\d+/)
            ?.toString();

        if (versionOutput.status !== 0 || version == null) {
            throw new ZkSyncSolcPluginError(COMPILER_BINARY_CORRUPTION_ERROR(compilerPath));
        }
    }
}