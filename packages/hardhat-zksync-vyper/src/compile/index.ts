import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import { ZkVyperConfig, CompilerOptions } from '../types';
import { ZkSyncVyperPluginError } from '../errors';
import { compileWithBinary } from './binary';
import {
    validateDockerIsInstalled,
    createDocker,
    pullImageIfNecessary,
    dockerImage,
    compileWithDocker,
} from './docker';

export async function compile(
    zkvyperConfig: ZkVyperConfig,
    inputPaths: string[],
    sourcesPath: string,
    vyperPath?: string,
) {
    let compiler: ICompiler;
    if (zkvyperConfig.compilerSource === 'binary') {
        if (vyperPath === null) {
            throw new ZkSyncVyperPluginError('vyper executable is not specified');
        }
        compiler = new BinaryCompiler(vyperPath!);
    } else if (zkvyperConfig.compilerSource === 'docker') {
        compiler = await DockerCompiler.initialize(zkvyperConfig);
    } else {
        throw new ZkSyncVyperPluginError(`Incorrect compiler source: ${zkvyperConfig.compilerSource}`);
    }

    return await compiler.compile(
        {
            inputPaths,
            sourcesPath,
            compilerPath: zkvyperConfig.settings.compilerPath,
        },
        zkvyperConfig,
    );
}

export interface ICompiler {
    compile(paths: CompilerOptions, config: ZkVyperConfig): Promise<any>;
}

export class BinaryCompiler implements ICompiler {
    constructor(public vyperPath: string) {}

    public async compile(paths: CompilerOptions, config: ZkVyperConfig) {
        return compileWithBinary(paths, config, this.vyperPath);
    }
}

export class DockerCompiler implements ICompiler {
    protected constructor(
        public dockerCompilerImage: Image,
        public docker: HardhatDocker,
    ) {}

    public static async initialize(config: ZkVyperConfig): Promise<ICompiler> {
        await validateDockerIsInstalled();

        const image = dockerImage(config.settings.experimental?.dockerImage, config.settings.experimental?.tag);
        const docker = await createDocker();
        await pullImageIfNecessary(docker, image);

        return new DockerCompiler(image, docker);
    }

    public async compile(paths: CompilerOptions, config: ZkVyperConfig) {
        return compileWithDocker(paths, this.docker, this.dockerCompilerImage, config);
    }
}
