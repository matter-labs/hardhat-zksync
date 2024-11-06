import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import semver from 'semver';
import { CompilerInput } from 'hardhat/types';
import { ZkSolcConfig } from '../types';
import { ZkSyncSolcPluginError } from '../errors';
import { findMissingLibraries, mapMissingLibraryDependencies, writeLibrariesToFile } from '../utils';
import {
    DETECT_MISSING_LIBRARY_MODE_COMPILER_VERSION,
    ZKSOLC_COMPILER_MIN_VERSION_WITH_FALLBACK_OZ,
} from '../constants';
import {
    validateDockerIsInstalled,
    createDocker,
    pullImageIfNecessary,
    dockerImage,
    compileWithDocker,
    getSolcVersion,
} from './docker';
import { compileWithBinary } from './binary';

export async function compile(zksolcConfig: ZkSolcConfig, input: CompilerInput, solcPath?: string) {
    let compiler: ICompiler;
    if (
        zksolcConfig.settings.optimizer?.fallback_to_optimizing_for_size &&
        semver.lt(zksolcConfig.version, ZKSOLC_COMPILER_MIN_VERSION_WITH_FALLBACK_OZ)
    ) {
        throw new ZkSyncSolcPluginError(
            `fallback_to_optimizing_for_size option in optimizer is not supported for zksolc compiler version ${zksolcConfig.version}. Please use version ${ZKSOLC_COMPILER_MIN_VERSION_WITH_FALLBACK_OZ} or higher.`,
        );
    }
    if (zksolcConfig.compilerSource === 'binary') {
        if (solcPath === null) {
            throw new ZkSyncSolcPluginError('solc executable is not specified');
        }
        compiler = new BinaryCompiler(solcPath!);
    } else if (zksolcConfig.compilerSource === 'docker') {
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
        config.settings.areLibrariesMissing = false;
        return await compileWithBinary(input, config, this.solcPath);
    }
}

export class DockerCompiler implements ICompiler {
    protected constructor(
        public dockerCompilerImage: Image,
        public docker: HardhatDocker,
    ) {}

    public static async initialize(config: ZkSolcConfig): Promise<DockerCompiler> {
        await validateDockerIsInstalled();

        const image = dockerImage(config.settings.experimental?.dockerImage, config.settings.experimental?.tag);
        const docker = await createDocker();
        await pullImageIfNecessary(docker, image);

        return new DockerCompiler(image, docker);
    }

    public async compile(input: CompilerInput, config: ZkSolcConfig) {
        // We don't check here for missing libraries because docker is using older versions of zksolc and it's deprecated
        return await compileWithDocker(input, this.docker, this.dockerCompilerImage, config);
    }

    public async solcVersion() {
        const versionOutput = await getSolcVersion(this.docker, this.dockerCompilerImage);
        const longVersion = versionOutput.match(/^Version: (.*)$/)![1];
        const version = longVersion.split('+')[0];
        return { version, longVersion };
    }
}
