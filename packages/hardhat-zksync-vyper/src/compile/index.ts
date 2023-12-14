import { ZkVyperConfig, CompilerOptions, CompilerOutput } from '../types';
import { compileWithBinary } from './binary';
import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import {
    validateDockerIsInstalled,
    createDocker,
    pullImageIfNecessary,
    dockerImage,
    compileWithDocker,
} from './docker';
import { ZkSyncVyperPluginError } from '../errors';

export async function compile(
    zkvyperConfig: ZkVyperConfig,
    inputPaths: string[],
    sourcesPath: string,
    rootPath: string,
    vyperPath?: string
) {
    let compiler: ICompiler;
    if (zkvyperConfig.compilerSource == 'binary') {
        if (vyperPath == null) {
            throw new ZkSyncVyperPluginError('vyper executable is not specified');
        }
        compiler = new BinaryCompiler(vyperPath);
    } else if (zkvyperConfig.compilerSource == 'docker') {
        compiler = await DockerCompiler.initialize(zkvyperConfig);
    } else {
        throw new ZkSyncVyperPluginError(`Incorrect compiler source: ${zkvyperConfig.compilerSource}`);
    }

    let output =  await compiler.compile({
        inputPaths,
        sourcesPath,
        compilerPath: zkvyperConfig.settings.compilerPath,
    },
        zkvyperConfig
    );

    if(process.platform !== 'win32') {
        return output;
    }

    return getWindowsOutput(output, rootPath);
}

function getWindowsOutput(output: CompilerOutput, path: string) {
    let { version, ...contracts } = output;
    let changedOutput = {} as CompilerOutput;

    let specificPath = path.replaceAll('\\', '/');
    for(let [sourceName, output] of Object.entries(contracts)) {
        sourceName = sourceName.replace(`//?/${specificPath}/`, '');
        changedOutput[sourceName] = output;
    }

    changedOutput.version = version;
    return changedOutput;
}

export interface ICompiler {
    compile(paths: CompilerOptions, config: ZkVyperConfig): Promise<any>;
}

export class BinaryCompiler implements ICompiler {
    constructor(public vyperPath: string) {}

    public async compile(paths: CompilerOptions, config: ZkVyperConfig) {
        return await compileWithBinary(paths, config, this.vyperPath);
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

    public async compile(paths: CompilerOptions, config: ZkVyperConfig) {
        return await compileWithDocker(paths, this.docker, this.dockerImage, config);
    }
}
