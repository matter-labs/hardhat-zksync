import { ZkSolcConfig } from '../types';
import { compileWithBinary } from './binary';
import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import semver from 'semver';
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
import { findMissingLibraries, mapMissingLibraryDependencies, writeLibrariesToFile } from '../utils';
import { DETECT_MISSING_LIBRARY_MODE_COMPILER_VERSION } from '../constants';

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
        if (semver.gte(config.version, DETECT_MISSING_LIBRARY_MODE_COMPILER_VERSION)) {
            const zkSolcOutput = await compileWithBinary(input, config, this.solcPath, true);

            const missingLibraries = findMissingLibraries(zkSolcOutput);
            if (missingLibraries.size > 0) {
                if (!config.settings.missingLibrariesPath) {
                    throw new ZkSyncSolcPluginError('Missing libraries path is not specified');
                }
                
                const missingLibraryDependencies = mapMissingLibraryDependencies(zkSolcOutput, missingLibraries);
                // Write missing libraries to file
                const missingLibrariesPath = config.settings.missingLibrariesPath!;
                await writeLibrariesToFile(missingLibrariesPath, missingLibraryDependencies);

                config.settings.areLibrariesMissing = true;
                return zkSolcOutput;
            }
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
