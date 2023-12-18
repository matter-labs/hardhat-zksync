import path from "path";
import fsExtra from "fs-extra";
import chalk from "chalk";
import { spawnSync } from 'child_process';

import { download, isVersionInRange, saveDataToFile, getLatestRelease, getZkVmSolcUrl } from "../utils";
import {
    DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD,
    DEFAULT_TIMEOUT_MILISECONDS,
    ZKSOLC_BIN_OWNER,
    USER_AGENT,
    ZKVM_SOLC_BIN_REPOSITORY,
    ZKVM_SOLC_BIN_REPOSITORY_NAME,
    COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR_ZKVM_SOLC,
    COMPILER_VERSION_RANGE_ERROR_ZKVM_SOLC,
    COMPILER_VERSION_WARNING_ZKVM_SOLC,
    COMPILER_BINARY_CORRUPTION_ERROR_ZKVM_SOLC} from "../constants";
import { ZkSyncSolcPluginError } from './../errors';

export interface CompilerVersionInfo {
    latest: string;
    minVersion: string;
}

/**
 * This class is responsible for downloading the zksolc binary.
 */
export class ZkVmSolcCompilerDownloader {

    public static async getDownloaderWithVersionValidated(
        zkVmSolcVersion: string,
        solcVersion: string,
        compilersDir: string,
    ): Promise<ZkVmSolcCompilerDownloader> {
        if (!ZkVmSolcCompilerDownloader._instance) {
            let compilerVersionInfo = await ZkVmSolcCompilerDownloader._getCompilerVersionInfo(compilersDir);
            if (compilerVersionInfo === undefined || (await ZkVmSolcCompilerDownloader._shouldDownloadCompilerVersionInfo(compilersDir))) {
                await ZkVmSolcCompilerDownloader._downloadCompilerVersionInfo(compilersDir);
                compilerVersionInfo = await ZkVmSolcCompilerDownloader._getCompilerVersionInfo(compilersDir);
            }

            if (compilerVersionInfo === undefined) {
                throw new ZkSyncSolcPluginError(COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR_ZKVM_SOLC);
            }

            if (zkVmSolcVersion === 'latest' || zkVmSolcVersion === compilerVersionInfo.latest) {
                zkVmSolcVersion = compilerVersionInfo.latest;
            } else if (!isVersionInRange(zkVmSolcVersion, compilerVersionInfo)) {
                throw new ZkSyncSolcPluginError(COMPILER_VERSION_RANGE_ERROR_ZKVM_SOLC(zkVmSolcVersion, compilerVersionInfo.minVersion, compilerVersionInfo.latest));
            } else {
                console.info(chalk.yellow(COMPILER_VERSION_WARNING_ZKVM_SOLC(zkVmSolcVersion, compilerVersionInfo.latest)));
            };

            ZkVmSolcCompilerDownloader._instance = new ZkVmSolcCompilerDownloader(solcVersion, zkVmSolcVersion, compilersDir);
        }

        return ZkVmSolcCompilerDownloader._instance;
    }

    private static _instance: ZkVmSolcCompilerDownloader;
    public static compilerVersionInfoCachePeriodMs = DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD;
    private version: string;

    /**
     * Use `getDownloaderWithVersionValidated` to create an instance of this class.
     */
    private constructor(
        private _solcVersion: string,
        private _zkVmSolcVersion: string,
        private readonly _compilersDirectory: string,
    ) {
        this.version = `${_solcVersion}-${_zkVmSolcVersion}`;
    }

    public getSolcVersion(): string {
        return this._solcVersion;
    }

    public getZkVmSolcVersion(): string {
        return this._zkVmSolcVersion;
    }

    public getVersion(): string {
        return this.version;
    }

    public getCompilerPath(): string {
        return path.join(this._compilersDirectory, 'zkvm-solc', `zkvm-solc-v${this.version}`);
    }

    public async isCompilerDownloaded(): Promise<boolean> {
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

        return age > ZkVmSolcCompilerDownloader.compilerVersionInfoCachePeriodMs;
    }

    private static _getCompilerVersionInfoPath(compilersDir: string): string {
        return path.join(compilersDir, 'zkvm-solc', 'compilerVersionInfo.json');
    }

    public async downloadCompiler(): Promise<void> {
        let compilerVersionInfo = await ZkVmSolcCompilerDownloader._getCompilerVersionInfo(this._compilersDirectory);

        if (compilerVersionInfo === undefined || (await ZkVmSolcCompilerDownloader._shouldDownloadCompilerVersionInfo(this._compilersDirectory))) {
            await ZkVmSolcCompilerDownloader._downloadCompilerVersionInfo(this._compilersDirectory);
            compilerVersionInfo = await ZkVmSolcCompilerDownloader._getCompilerVersionInfo(this._compilersDirectory);
        }

        if (compilerVersionInfo === undefined) {
            throw new ZkSyncSolcPluginError(COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR_ZKVM_SOLC);
        }
        //TODO: check if we have version range
        // if (!isVersionInRange(this._version, compilerVersionInfo)) {
        //     throw new ZkSyncSolcPluginError(COMPILER_VERSION_RANGE_ERROR(this._version, compilerVersionInfo.minVersion, compilerVersionInfo.latest));
        // }

        try {
            console.info(chalk.yellow(`Downloading zkvm-solc ${this.version}`));
            await this._downloadCompiler();
            console.info(chalk.green(`zkvm-solc version ${this.version} successfully downloaded`));
        } catch (e: any) {
            throw new ZkSyncSolcPluginError(e.message.split('\n')[0]);
        }

        await this._postProcessCompilerDownload();
        await this._verifyCompiler();
    }

    /*
        Currently, the compiler version info is pulled from the constants and not from the remote origin, in the future we will allow it to be downloaded from CDN-a.
        We are currently limited in that each new version requires an update of the plugin version.
    */
    private static async _downloadCompilerVersionInfo(compilersDir: string): Promise<void> {
        const latestRelease = await getLatestRelease(ZKSOLC_BIN_OWNER, ZKVM_SOLC_BIN_REPOSITORY_NAME, USER_AGENT, "");
        const releaseToSave = {
            latest: latestRelease.split('-')[1],
            minVersion: "1.0.0"
        }
        const savePath = this._getCompilerVersionInfoPath(compilersDir);
        await saveDataToFile(releaseToSave, savePath);
    }

    private async _downloadCompiler(): Promise<string> {
        const downloadPath = this.getCompilerPath();

        const url = this._getCompilerUrl(true);
        try {
            await this._attemptDownload(url, downloadPath);
        } catch (e: any) {
            const fallbackUrl = this._getCompilerUrl(false);
            await this._attemptDownload(fallbackUrl, downloadPath);
        }
        return downloadPath;
    }

    private _getCompilerUrl(useGithubRelease: boolean): string {
        return getZkVmSolcUrl(ZKVM_SOLC_BIN_REPOSITORY, this.version, useGithubRelease);
    }

    private async _attemptDownload(url: string, downloadPath: string): Promise<void> {
        return download(url, downloadPath, 'hardhat-zksync', `${this.version}`, DEFAULT_TIMEOUT_MILISECONDS);
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
            throw new ZkSyncSolcPluginError(COMPILER_BINARY_CORRUPTION_ERROR_ZKVM_SOLC(compilerPath));
        }
    }
}
