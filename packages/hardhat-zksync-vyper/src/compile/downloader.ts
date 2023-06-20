import path from "path";
import fsExtra from "fs-extra";
import chalk from "chalk";
import { spawnSync } from 'child_process';

import { download } from 'hardhat/internal/util/download';

import { getZkvyperUrl, isURL, isVersionInRange } from "../utils";
import { 
    COMPILER_BINARY_CORRUPTION_ERROR, 
    COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR, 
    COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR, 
    COMPILER_VERSION_RANGE_ERROR, 
    COMPILER_VERSION_WARNING, 
    DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD, 
    ZKVYPER_BIN_REPOSITORY, 
    ZKVYPER_BIN_VERSION_INFO 
} from "../constants";
import { ZkSyncVyperPluginError } from "../errors";

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
            if (compilerVersionInfo === undefined || (await ZkVyperCompilerDownloader._shouldDownloadCompilerVersionInfo(compilersDir))) {
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
            
            if (version === 'latest' || version === compilerVersionInfo.latest) {
                version = compilerVersionInfo.latest;
            } else if (!isVersionInRange(version, compilerVersionInfo)) {
                throw new ZkSyncVyperPluginError(COMPILER_VERSION_RANGE_ERROR(version, compilerVersionInfo.minVersion, compilerVersionInfo.latest));
            } else {
                console.info(chalk.yellow(COMPILER_VERSION_WARNING(version, compilerVersionInfo.latest)));
            };

            ZkVyperCompilerDownloader._instance = new ZkVyperCompilerDownloader(version, configCompilerPath, compilersDir);
        }

        return ZkVyperCompilerDownloader._instance;
    }

    private static _instance: ZkVyperCompilerDownloader;
    public static compilerVersionInfoCachePeriodMs = DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD;

    /** 
     * Use `getDownloaderWithVersionValidated` to create an instance of this class.
     */
    private constructor(
        private _version: string,
        private readonly _configCompilerPath: string,
        private readonly _compilersDirectory: string,
    ) { }

    public getVersion(): string {
        return this._version;
    }

    public getCompilerPath(): string {
        if (this._configCompilerPath) {
            return this._configCompilerPath;
        }

        return path.join(this._compilersDirectory, 'zkvyper', `zkvyper-v${this._version}`);
    }

    public async isCompilerDownloaded(): Promise<boolean> {        
        if (this._configCompilerPath) {
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

        return age > ZkVyperCompilerDownloader.compilerVersionInfoCachePeriodMs;
    }

    private static _getCompilerVersionInfoPath(compilersDir: string): string {
        return path.join(compilersDir, 'zkvyper', 'compilerVersionInfo.json');
    }

    public async downloadCompiler(): Promise<void> {
        let compilerVersionInfo = await ZkVyperCompilerDownloader._getCompilerVersionInfo(this._compilersDirectory);

        if (compilerVersionInfo === undefined || (await ZkVyperCompilerDownloader._shouldDownloadCompilerVersionInfo(this._compilersDirectory))) {
            try {
                await ZkVyperCompilerDownloader._downloadCompilerVersionInfo(this._compilersDirectory);
            } catch (e: any) {
                throw new ZkSyncVyperPluginError(COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR)
            }

            compilerVersionInfo = await ZkVyperCompilerDownloader._getCompilerVersionInfo(this._compilersDirectory);
        }

        if (compilerVersionInfo === undefined) {
            throw new ZkSyncVyperPluginError(COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR);
        }
        if (!isVersionInRange(this._version, compilerVersionInfo)) {
            throw new ZkSyncVyperPluginError(COMPILER_VERSION_RANGE_ERROR(this._version, compilerVersionInfo.minVersion, compilerVersionInfo.latest));
        }

        try {
            console.info(chalk.yellow(`Downloading zkvyper ${this._version}`));
            await this._downloadCompiler();
            console.info(chalk.green(`zkvyper version ${this._version} successfully downloaded`));
        } catch (e: any) {
            throw new ZkSyncVyperPluginError(e.message.split('\n')[0]);
        }

        await this._postProcessCompilerDownload();
        await this._verifyCompiler();
    }

    private static async _downloadCompilerVersionInfo(compilersDir: string): Promise<void> {
        const url = `${ZKVYPER_BIN_VERSION_INFO}/version.json`;
        const downloadPath = this._getCompilerVersionInfoPath(compilersDir);

        await download(url, downloadPath);
    }

    private async _downloadCompiler(): Promise<string> {
        let url = this._configCompilerPath;
        if (!isURL(url)) {
            url = getZkvyperUrl(ZKVYPER_BIN_REPOSITORY, this._version);
        }

        const downloadPath = this.getCompilerPath();
        await download(url, downloadPath);
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
            throw new ZkSyncVyperPluginError(COMPILER_BINARY_CORRUPTION_ERROR(compilerPath));
        }
    }
}