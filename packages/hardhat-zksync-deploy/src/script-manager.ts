import { existsSync } from 'fs';
import { HardhatRuntimeEnvironment, Network } from 'hardhat/types';
import * as path from 'path';
import { glob } from 'glob';
import { promisify } from 'util';

import { ZkSyncDeployPluginError } from './errors';
import { DEFAULT_DEPLOY_SCRIPTS_PATH } from './constants';

const globPromise = promisify(glob);

export class ScriptManager {
    private funcByFilePath: {[filename: string]: any};
    private filePaths: string[];
    private deployPaths: string[];

    constructor(private hre: HardhatRuntimeEnvironment) {
        this.hre = hre;
        this.deployPaths = [path.join(hre.config.paths.root, DEFAULT_DEPLOY_SCRIPTS_PATH)];
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
                globPromise(path.join(dir, '**', '*.ts')),
                globPromise(path.join(dir, '**', '*.js')),
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

            const matchedFiles = glob.sync(path.join(dir, '**', script));

            if (matchedFiles.length) {
                return matchedFiles[0];
            }
        }

        throw new ZkSyncDeployPluginError(
            `Deploy script '${script}' not found, in deploy folders:\n${this.deployPaths.join(',\n')}.`
        );
    }

    public async callDeployScripts(targetScript: string, tags?: string[] | undefined) {
        if (targetScript === '') {
            const scripts = await this.findAllDeployScripts();
            const filePathsByTag = await this.collectTags(scripts, tags);
            const scriptsToRun = await this.getScriptsToRun(filePathsByTag);
            for (const script of scriptsToRun) {
                await this.runScript(script);
            }
        } else {
            await this.runScript(this.findDeployScript(targetScript));
        }
    }

    private async runScript(script: string) {
        const deployFn = await this.getDeployFunc(script);

        await deployFn(this.hre);
    }

    private async getDeployFunc(script: string) {
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
        const filePathsByTag: {[tag: string]: string[]} = {};

        // Clear state every time collecting tags is executed
        this.filePaths = [];
        this.funcByFilePath = [];

        for (const script of scripts) {
            const filePath = path.resolve(script);
            const deployFn = await this.getDeployFunc(filePath);

            this.funcByFilePath[filePath] = deployFn;

            let scriptTags = deployFn.tags;
            if (scriptTags !== undefined) {
              if (typeof scriptTags === 'string') {
                scriptTags = [scriptTags];
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
                const filteredTags = tags.filter(value => scriptTags.includes(value));
                if (filteredTags.length) {
                    this.filePaths.push(filePath);
                }
              } else {
                this.filePaths.push(filePath);
              }
            }
        }

        return filePathsByTag;
    }

    public async getScriptsToRun(filePathsByTag: {[tag: string]: string[]}): Promise<string[]> {    
        const filePathRegistered: {[filePath: string]: boolean} = {};
        const scriptsToRun: string[] = []

        const recurseDependencies = (filePath: string) => {
            if (filePathRegistered[filePath]) return;

            const deployFn = this.funcByFilePath[filePath];
            if (deployFn.dependencies) {
                for (const dependency of deployFn.dependencies) {
                  const tagFilePaths = filePathsByTag[dependency];
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
        }
        
        for (const filePath of this.filePaths) {
            recurseDependencies(filePath);
        }

        return scriptsToRun;
    }
}