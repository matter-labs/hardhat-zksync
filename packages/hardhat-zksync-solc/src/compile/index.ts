import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import semver from 'semver';
import { CompilerInput } from 'hardhat/types';
import { LinkLibraries, ZkSolcConfig } from '../types';
import { ZkSyncSolcPluginError } from '../errors';
import { findMissingLibraries, mapMissingLibraryDependencies, writeLibrariesToFile } from '../utils';
import {
    DETECT_MISSING_LIBRARY_MODE_COMPILER_VERSION,
    ZKSOLC_COMPILER_MIN_VERSION_WITH_FALLBACK_OZ,
    ZKSOLC_COMPILER_VERSION_WITH_LIBRARY_LINKING,
} from '../constants';
import {
    validateDockerIsInstalled,
    createDocker,
    pullImageIfNecessary,
    dockerImage,
    compileWithDocker,
    getSolcVersion,
} from './docker';
import { compileWithBinary, linkWithBinary } from './binary';

export async function compile(zksolcConfig: ZkSolcConfig, input: CompilerInput, solcPath?: string) {
    validateFallbackOZOption(zksolcConfig);

    const compiler = await resolveCompiler(zksolcConfig, solcPath);
    return compiler.compile(input, zksolcConfig);
}

export async function link(zksolcConfig: ZkSolcConfig, linkLibraries: LinkLibraries) {
    if (zksolcConfig.compilerSource !== 'binary') {
        throw new ZkSyncSolcPluginError('Linking is only supported with binary compiler');
    }

    const linker: ILinker = new BinaryLinker();
    return linker.link(zksolcConfig, linkLibraries);
}

export interface ICompiler {
    compile(input: CompilerInput, config: ZkSolcConfig): Promise<any>;
}

export interface ILinker {
    link(config: ZkSolcConfig, linkLibraries: LinkLibraries): Promise<any>;
}

export class BinaryCompiler implements ICompiler {
    constructor(public solcPath: string) {}

    public async compile(input: CompilerInput, config: ZkSolcConfig) {
        // Check for missing libraries
        if (
            semver.gte(config.version, DETECT_MISSING_LIBRARY_MODE_COMPILER_VERSION) &&
            semver.lt(config.version, ZKSOLC_COMPILER_VERSION_WITH_LIBRARY_LINKING)
        ) {
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

/**
 * Dedicated linker for binary builds.
 * Linking does not require the local `solc` binary, only the `zksolc` executable
 * referenced by `config.settings.compilerPath`, therefore no constructor arguments.
 */
export class BinaryLinker implements ILinker {
    public async link(config: ZkSolcConfig, linkLibraries: LinkLibraries) {
        return await linkWithBinary(config, linkLibraries);
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

/**
 * Throws if the `fallback_to_optimizing_for_size` optimizer flag is used with an old compiler.
 */
function validateFallbackOZOption(config: ZkSolcConfig) {
    if (
        config.settings.optimizer?.fallback_to_optimizing_for_size &&
        semver.lt(config.version, ZKSOLC_COMPILER_MIN_VERSION_WITH_FALLBACK_OZ)
    ) {
        throw new ZkSyncSolcPluginError(
            `fallback_to_optimizing_for_size option in optimizer is not supported for zksolc compiler version ${config.version}. ` +
                `Please use version ${ZKSOLC_COMPILER_MIN_VERSION_WITH_FALLBACK_OZ} or higher.`,
        );
    }
}

/**
 * Factory that returns the appropriate compiler implementation
 * based on the user‑supplied configuration.
 */
async function resolveCompiler(config: ZkSolcConfig, solcPath?: string): Promise<ICompiler> {
    switch (config.compilerSource) {
        case 'binary':
            if (!solcPath) {
                throw new ZkSyncSolcPluginError('solc executable is not specified');
            }
            return new BinaryCompiler(solcPath);

        case 'docker':
            return DockerCompiler.initialize(config);

        default:
            throw new ZkSyncSolcPluginError(`Incorrect compiler source: ${config.compilerSource}`);
    }
}
