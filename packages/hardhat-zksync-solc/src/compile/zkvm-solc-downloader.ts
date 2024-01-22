import path from 'path';
import fsExtra from 'fs-extra';
import chalk from 'chalk';
import { spawnSync } from 'child_process';

import { download, getZkVmSolcUrl } from '../utils';
import {
    DEFAULT_TIMEOUT_MILISECONDS,
    ZKVM_SOLC_BIN_REPOSITORY,
    COMPILER_BINARY_CORRUPTION_ERROR_ZKVM_SOLC,
    USER_AGENT,
} from '../constants';
import { ZkSyncSolcPluginError } from '../errors';

/**
 * This class is responsible for downloading the zkvm solc binary.
 */
export class ZkVmSolcCompilerDownloader {
    public static async getDownloaderWithVersionValidated(
        zkVmSolcVersion: string,
        solcVersion: string,
        compilersDir: string,
    ): Promise<ZkVmSolcCompilerDownloader> {
        if (
            !ZkVmSolcCompilerDownloader._instance ||
            ZkVmSolcCompilerDownloader._instance.getZkVmSolcVersion() !== zkVmSolcVersion ||
            ZkVmSolcCompilerDownloader._instance.getSolcVersion() !== solcVersion
        ) {
            ZkVmSolcCompilerDownloader._instance = new ZkVmSolcCompilerDownloader(
                solcVersion,
                zkVmSolcVersion,
                compilersDir,
            );
        }

        return ZkVmSolcCompilerDownloader._instance;
    }

    private static _instance: ZkVmSolcCompilerDownloader;
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

    public async downloadCompiler(): Promise<void> {
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
        return download(url, downloadPath, USER_AGENT, DEFAULT_TIMEOUT_MILISECONDS);
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

        if (versionOutput.status !== 0 || version === null) {
            throw new ZkSyncSolcPluginError(COMPILER_BINARY_CORRUPTION_ERROR_ZKVM_SOLC(compilerPath));
        }
    }
}
