import { ZkSolcConfig } from './types';
import { checkZksolcBinary, compileWithBinary } from './compiler-utils/bin';
import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import {
    validateDockerIsInstalled,
    createDocker,
    pullImageIfNecessary,
    dockerImage,
    compileWithDocker,
} from './compiler-utils/docker';
import { ProjectPathsConfig, CompilerInput } from 'hardhat/types';

export interface ICompiler {
    compile(input: CompilerInput, config: ZkSolcConfig): Promise<any>;
}

export class BinaryCompiler implements ICompiler {
    public static async initialize(): Promise<ICompiler> {
        checkZksolcBinary();
        return new BinaryCompiler();
    }
    public async compile(input: CompilerInput, config: ZkSolcConfig): Promise<any> {
        return await compileWithBinary(input, config);
        // return {
        //     status: outcome.status,
        //     stdout: outcome.stdout,
        //     stderr: outcome.stderr,
        // }
    }
}

export class DockerCompiler implements ICompiler {
    dockerImage: Image;
    docker: HardhatDocker;

    private constructor(dockerImage: Image, docker: HardhatDocker) {
        this.dockerImage = dockerImage;
        this.docker = docker;
    }

    public static async initialize(config: ZkSolcConfig): Promise<ICompiler> {
        await validateDockerIsInstalled();

        const image = dockerImage(config.settings.experimental.dockerImage);
        const docker = await createDocker();
        await pullImageIfNecessary(docker, image);

        return new DockerCompiler(image, docker);
    }

    public async compile(input: CompilerInput, config: ZkSolcConfig): Promise<any> {
        return await compileWithDocker(input, this.docker, this.dockerImage, config);
    }
}
