import { ZkSolcConfig } from '../types';
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

export async function compile(zksolcConfig: ZkSolcConfig, input: CompilerInput, solcPath?: string) {
    let compiler: ICompiler;
    if (zksolcConfig.compilerSource == 'binary') {
        if (solcPath == null) {
            throw pluginError('solc executable is not specified');
        }
        compiler = new BinaryCompiler(solcPath);
    } else if (zksolcConfig.compilerSource == 'docker') {
        compiler = await DockerCompiler.initialize(zksolcConfig);
    } else {
        throw pluginError(`Incorrect compiler source: ${zksolcConfig.compilerSource}`);
    }

    return await compiler.compile(input, zksolcConfig);
}

export interface ICompiler {
    compile(input: CompilerInput, config: ZkSolcConfig): Promise<any>;
}

export class BinaryCompiler implements ICompiler {
    constructor(public solcPath: string) {}

    public async compile(input: CompilerInput, config: ZkSolcConfig): Promise<any> {
        return await compileWithBinary(input, config, this.solcPath);
    }
}

export class DockerCompiler implements ICompiler {
    protected constructor(public dockerImage: Image, public docker: HardhatDocker) {}

    public static async initialize(config: ZkSolcConfig): Promise<ICompiler> {
        await validateDockerIsInstalled();

        const image = dockerImage(config.settings.experimental?.dockerImage);
        const docker = await createDocker();
        await pullImageIfNecessary(docker, image);

        return new DockerCompiler(image, docker);
    }

    public async compile(input: CompilerInput, config: ZkSolcConfig): Promise<any> {
        return await compileWithDocker(input, this.docker, this.dockerImage, config);
    }
}
