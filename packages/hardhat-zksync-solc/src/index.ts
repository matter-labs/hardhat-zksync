import {
    TASK_COMPILE_SOLIDITY_RUN_SOLC,
    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
} from 'hardhat/builtin-tasks/task-names';
import { extendConfig, subtask } from 'hardhat/internal/core/config/config-env';
import { CompilerInput } from 'hardhat/types';
import './type-extensions';
import { ZkSyncArtifact, FactoryDeps } from './types';
import { compile } from './compile';
import { add0xPrefixIfNecessary } from './utils';

const ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';

extendConfig((config) => {
    const defaultConfig = {
        version: 'latest',
        compilerSource: 'binary',
        settings: {
            optimizer: {
                enabled: false,
            },
        },
        experimental: {
            dockerImage: null,
        },
    };
    config.zksolc = { ...defaultConfig, ...config.zksolc };

    // TODO: If solidity optimizer is not enabled, the libraries are not inlined and
    // we have to manually pass them into zksolc. So for now we force the optimization.
    config.solidity.compilers.forEach(compiler => {
        let settings = compiler.settings || {};
        compiler.settings = { ...settings, optimizer: { enabled: true } };
    });
});

subtask(
    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
    async ({
        sourceName,
        contractName,
        contractOutput,
    }: {
        sourceName: string;
        contractName: string;
        contractOutput: any;
    }): Promise<ZkSyncArtifact> => {
        let bytecode: string =
            contractOutput.evm?.bytecode?.object || contractOutput.evm?.deployedBytecode?.object || '';
        bytecode = add0xPrefixIfNecessary(bytecode);

        let factoryDeps: FactoryDeps = {};
        let entries: [string, string][] = Object.entries(contractOutput.factoryDependencies || {});
        for (const [hash, dependency] of entries) {
            factoryDeps[add0xPrefixIfNecessary(hash)] = dependency;
        }

        return {
            _format: ARTIFACT_FORMAT_VERSION,
            contractName,
            sourceName,
            abi: contractOutput.abi,
            // technically, zkEVM has no difference between bytecode & deployedBytecode,
            // but both fields are included just in case
            bytecode,
            deployedBytecode: bytecode,
            linkReferences: {},
            deployedLinkReferences: {},

            // zkSync-specific field
            factoryDeps,
        };
    }
);

// TODO: fix docker compilation
subtask(TASK_COMPILE_SOLIDITY_RUN_SOLC, async ({ input }: { input: CompilerInput }, { config }) => {
    // This plugin is experimental, so this task isn't split into multiple
    // subtasks yet.
    return await compile(config.zksolc, input);
});
