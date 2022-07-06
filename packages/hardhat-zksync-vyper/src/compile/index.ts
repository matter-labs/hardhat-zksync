import { ZkVyperConfig } from '../types';
import { compileWithBinary } from './binary';
import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import {
    validateDockerIsInstalled,
    createDocker,
    pullImageIfNecessary,
    dockerImage,
    compileWithDocker,
} from './docker';
import { CompilerInput } from 'hardhat/types';
import { pluginError } from '../utils';

export async function compile(zkvyperConfig: ZkVyperConfig, inputPaths: string[], vyperPath?: string) {
    let compiler: ICompiler;
    if (zkvyperConfig.compilerSource == 'binary') {
        if (vyperPath == null) {
            throw pluginError('solc executable is not specified');
        }
        compiler = new BinaryCompiler(vyperPath);
    // } else if (zkvyperConfig.compilerSource == 'docker') {
    //     compiler = await DockerCompiler.initialize(zkvyperConfig);
    } else {
        throw pluginError(`Incorrect compiler source: ${zkvyperConfig.compilerSource}`);
    }

    return await compiler.compile(inputPaths, zkvyperConfig);
}

export interface ICompiler {
    compile(inputPaths: string[], config: ZkVyperConfig): Promise<any>;
}

export class BinaryCompiler implements ICompiler {
    constructor(public solcPath: string) {}

    public async compile(inputPaths: string[], config: ZkVyperConfig) {
        return await compileWithBinary(inputPaths, config, this.solcPath);
    }
}

// TODO: IDK if this will be needed at all
// export class DockerCompiler implements ICompiler {
//     protected constructor(public dockerImage: Image, public docker: HardhatDocker) {}
//
//     public static async initialize(config: ZkVyperConfig): Promise<ICompiler> {
//         await validateDockerIsInstalled();
//
//         const image = dockerImage(config.settings.experimental?.dockerImage, config.settings.experimental?.tag);
//         const docker = await createDocker();
//         await pullImageIfNecessary(docker, image);
//
//         return new DockerCompiler(image, docker);
//     }
//
//     public async compile(input: CompilerInput, _config: ZkVyperConfig) {
//         return await compileWithDocker(input, this.docker, this.dockerImage);
//     }
// }
