import { Artifacts, ProjectPathsConfig, CompilerInput } from 'hardhat/types';
import path from 'path';

import { FactoryDeps, ZkSolcConfig, ZkSyncArtifact } from './types';
import { add0xPrefixIfNecessary, pluginError } from './utils';
import { BinaryCompiler, DockerCompiler, ICompiler } from './compiler';

export const ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';

export async function compile(zksolcConfig: ZkSolcConfig, input: CompilerInput) {
    let compiler: ICompiler | undefined = undefined;
    if (zksolcConfig.compilerSource == 'binary') {
        compiler = await BinaryCompiler.initialize();
    } else if (zksolcConfig.compilerSource == 'docker') {
        compiler = await DockerCompiler.initialize(zksolcConfig);
    } else {
        throw pluginError(`Incorrect compiler source: ${zksolcConfig.compilerSource}`);
    }

    return await compiler.compile(input, zksolcConfig);
}
