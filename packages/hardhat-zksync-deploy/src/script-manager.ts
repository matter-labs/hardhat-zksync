import { existsSync } from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as path from 'path';
import { glob } from 'glob';

import { ZkSyncDeployPluginError } from './errors';
import { SCRIPT_DEFAULT_PRIORITY } from './constants';

export class ScriptManager {
    private funcByFilePath: { [filename: string]: any };
    private filePaths: any[];
    private deployPaths: string[];

    constructor(private _hre: HardhatRuntimeEnvironment) {
        this.deployPaths = _hre.network.deployPaths;
        this.funcByFilePath = {};
        this.filePaths = [];
    }

    public async findAllDeployScripts(): Promise<string[]> {
        let files: string[] = [];

        for (const dir of this.deployPaths) {
            if (!existsSync(dir)) {
                throw new ZkSyncDeployPluginError(`Deploy folder '${dir}' not found.`);
            }

            const [tsFilesInDir, jsFilesInDir] = await Promise.all([
                await glob(path.join(dir, '**', '*.ts').replace(/\\/g, '/'), {}),
                await glob(path.join(dir, '**', '*.js').replace(/\\/g, '/'), {}),
            ]);

            const filesInDir = tsFilesInDir.concat(jsFilesInDir);
            filesInDir.sort();
            files = files.concat(filesInDir);
        }

        return files;
    }

    public findDeployScript(script: string): string {
        for (const dir of this.deployPaths) {
            if (!existsSync(dir)) {
                continue;
            }

            const matchedFiles = glob.sync(path.join(dir, '**', script).replace(/\\/g, '/'));

            if (matchedFiles.length) {
                return matchedFiles[0];
            }
        }

        throw new ZkSyncDeployPluginError(
            `Deploy script '${script}' not found, in deploy folders:\n${this.deployPaths.join(',\n')}.`,
        );
    }

    public async callDeployScripts(targetScript: string, tags?: string[] | undefined) {
        let scripts: string[] = [];
        if (targetScript === '') {
            scripts = await this.findAllDeployScripts();
        } else {
            scripts = [this.findDeployScript(targetScript)];
        }

        const filePathsByTag = await this.collectTags(scripts, tags);

        const scriptsToRun = await this.getScriptsToRun(filePathsByTag);
        for (const script of scriptsToRun) {
            await this._runScript(script);
        }
    }

    private async _runScript(script: string) {
        const deployFn = await this._getDeployFunc(script);

        await deployFn(this._hre);
    }

    private async _getDeployFunc(script: string) {
        delete require.cache[script];
        let deployFn: any = require(script);

        if (typeof deployFn.default === 'function') {
            deployFn = deployFn.default;
        }

        if (typeof deployFn !== 'function') {
            throw new ZkSyncDeployPluginError('Deploy function does not exist or exported invalidly.');
        }

        return deployFn;
    }

    public async collectTags(scripts: string[], tags?: string[] | undefined) {
        const filePathsByTag: { [tag: string]: string[] } = {};
        // Clear state every time collecting tags is executed
        this.filePaths = [];
        this.funcByFilePath = [];

        for (const script of scripts) {
            const filePath = path.resolve(script);
            const deployFn = await this._getDeployFunc(filePath);

            this.funcByFilePath[filePath] = deployFn;

            let scriptTags = deployFn.tags;
            if (scriptTags !== undefined) {
                if (typeof scriptTags === 'string') {
                    scriptTags = [scriptTags];
                }
            } else {
                scriptTags = ['default'];
            }

            for (const tag of scriptTags) {
                if (tag.includes(',')) {
                    throw new ZkSyncDeployPluginError('Tag cannot contains commas.');
                }

                const tagFilePaths = filePathsByTag[tag] || [];
                filePathsByTag[tag] = tagFilePaths;
                tagFilePaths.push(filePath);
            }

            if (tags !== undefined) {
                const filteredTags = tags.filter((value) => scriptTags.includes(value));
                if (filteredTags.length) {
                    this.filePaths.push({ priority: deployFn.priority ?? SCRIPT_DEFAULT_PRIORITY, path: filePath });
                }
            } else {
                this.filePaths.push({ priority: deployFn.priority ?? SCRIPT_DEFAULT_PRIORITY, path: filePath });
            }
        }

        return filePathsByTag;
    }

    public async getScriptsToRun(filePathsByTag: { [tag: string]: string[] }): Promise<string[]> {
        const filePathRegistered: { [filePath: string]: boolean } = {};
        const scriptsToRun: string[] = [];

        const recurseDependencies = (filePath: string) => {
            if (filePathRegistered[filePath]) return;

            const deployFn = this.funcByFilePath[filePath];
            if (deployFn.dependencies) {
                for (const dependency of deployFn.dependencies) {
                    const tagFilePaths = filePathsByTag[dependency];
                    if (!tagFilePaths) {
                        throw new ZkSyncDeployPluginError(
                            `Not found tag at script: ${filePath} for dependency: ${dependency}`,
                        );
                    }
                    if (tagFilePaths.length) {
                        for (const tagFilePath of tagFilePaths) {
                            recurseDependencies(tagFilePath);
                        }
                    }
                }
            }

            if (!filePathRegistered[filePath]) {
                scriptsToRun.push(filePath);
                filePathRegistered[filePath] = true;
            }
        };

        const sortedFiles = this.filePaths.sort((a, b) => b.priority - a.priority).flatMap((a) => a.path);

        for (const filePath of sortedFiles) {
            recurseDependencies(filePath);
        }

        return scriptsToRun;
    }
}
