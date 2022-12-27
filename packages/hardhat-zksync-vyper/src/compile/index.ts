import { ZkVyperConfig, CompilerOptions } from '../types';
import { compileWithBinary } from './binary';
import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import {
    validateDockerIsInstalled,
    createDocker,
    pullImageIfNecessary,
    dockerImage,
    compileWithDocker,
} from './docker';
import { pluginError, getZkvyperPath } from '../utils';

export async function compile(
    zkvyperConfig: ZkVyperConfig,
    inputPaths: string[],
    sourcesPath: string,
    vyperPath?: string
) {
    let compiler: ICompiler;
    if (zkvyperConfig.compilerSource == 'binary') {
        if (vyperPath == null) {
            throw pluginError('vyper executable is not specified');
        }
        compiler = new BinaryCompiler(vyperPath);
    } else if (zkvyperConfig.compilerSource == 'docker') {
        compiler = await DockerCompiler.initialize(zkvyperConfig);
    } else {
        throw pluginError(`Incorrect compiler source: ${zkvyperConfig.compilerSource}`);
    }

    return await compiler.compile({
        inputPaths,
        sourcesPath,
        compilerPath: zkvyperConfig.settings.compilerPath || (await getZkvyperPath(zkvyperConfig.version)),
    });
}

export interface ICompiler {
    compile(paths: CompilerOptions): Promise<any>;
}

export class BinaryCompiler implements ICompiler {
    constructor(public vyperPath: string) {}

    public async compile(paths: CompilerOptions) {
        return await compileWithBinary(paths, this.vyperPath);
    }
}

export class DockerCompiler implements ICompiler {
    protected constructor(public dockerImage: Image, public docker: HardhatDocker) {}

    public static async initialize(config: ZkVyperConfig): Promise<ICompiler> {
        await validateDockerIsInstalled();

        const image = dockerImage(config.settings.experimental?.dockerImage, config.settings.experimental?.tag);
        const docker = await createDocker();
        await pullImageIfNecessary(docker, image);

        return new DockerCompiler(image, docker);
    }

    public async compile(paths: CompilerOptions) {
        return await compileWithDocker(paths, this.docker, this.dockerImage);
    }
}
