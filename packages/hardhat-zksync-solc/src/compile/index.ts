import { ZkSolcConfig } from '../types';
import { compileWithBinary } from './binary';
import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import {
    validateDockerIsInstalled,
    createDocker,
    pullImageIfNecessary,
    dockerImage,
    compileWithDocker,
    getSolcVersion,
} from './docker';
import { CompilerInput } from 'hardhat/types';
import { ZkSyncSolcPluginError } from '../errors';
import { findMissingLibraries, mapMissingLibraryDependencies } from '../utils';
import chalk from 'chalk';
import fse from 'fs-extra';

export async function compile(zksolcConfig: ZkSolcConfig, input: CompilerInput, solcPath?: string) {
    let compiler: ICompiler;
    if (zksolcConfig.compilerSource == 'binary') {
        if (solcPath == null) {
            throw new ZkSyncSolcPluginError('solc executable is not specified');
        }
        compiler = new BinaryCompiler(solcPath);
    } else if (zksolcConfig.compilerSource == 'docker') {
        compiler = await DockerCompiler.initialize(zksolcConfig);
    } else {
        throw new ZkSyncSolcPluginError(`Incorrect compiler source: ${zksolcConfig.compilerSource}`);
    }

    return await compiler.compile(input, zksolcConfig);
}

export interface ICompiler {
    compile(input: CompilerInput, config: ZkSolcConfig): Promise<any>;
}

export class BinaryCompiler implements ICompiler {
    constructor(public solcPath: string) {}

    public async compile(input: CompilerInput, config: ZkSolcConfig) {
        // Check for missing libraries
        const zkSolcOutput = await compileWithBinary(input, config, this.solcPath, true);
        const missingLibraries = findMissingLibraries(zkSolcOutput);
        if (missingLibraries.size > 0) {
            console.info(chalk.yellow('zkSync compiler detected missing libraries.'));
            // TODO: File must be updated not overwritten
            // TODO: Check if compile jobs are running in parallel
            // TODO: Fix message about missing libraries and with detailed next steps
            // TODO: Support for missing library file with directory (relative path)
            const missingLibraryDependencies = mapMissingLibraryDependencies(zkSolcOutput, missingLibraries);
            // Write missing librariry dependencies to JSON file
            if (config.settings.missingLibrariesPath == null || config.settings.missingLibrariesPath == undefined) {
                throw new ZkSyncSolcPluginError('Missing libraries path is not specified');
            }

            fse.outputFileSync(config.settings.missingLibrariesPath!, JSON.stringify(missingLibraryDependencies, null, 4));
            return zkSolcOutput;
        }

        return await compileWithBinary(input, config, this.solcPath);
    }
}

export class DockerCompiler implements ICompiler {
    protected constructor(public dockerImage: Image, public docker: HardhatDocker) {}

    public static async initialize(config: ZkSolcConfig): Promise<DockerCompiler> {
        await validateDockerIsInstalled();

        const image = dockerImage(config.settings.experimental?.dockerImage, config.settings.experimental?.tag);
        const docker = await createDocker();
        await pullImageIfNecessary(docker, image);

        return new DockerCompiler(image, docker);
    }

    public async compile(input: CompilerInput, config: ZkSolcConfig) {
        // We don't check here for missing libraries because docker is using older versions of zksolc and it's deprecated

        return await compileWithDocker(input, this.docker, this.dockerImage, config);
    }

    public async solcVersion() {
        const versionOutput = await getSolcVersion(this.docker, this.dockerImage);
        const longVersion = versionOutput.match(/^Version: (.*)$/)![1];
        const version = longVersion.split('+')[0];
        return { version, longVersion };
    }
}
