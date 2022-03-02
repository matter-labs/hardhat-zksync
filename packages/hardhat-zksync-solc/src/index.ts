import {
    TASK_COMPILE_SOLIDITY_RUN_SOLC,
    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
} from 'hardhat/builtin-tasks/task-names';
import { extendEnvironment, subtask } from 'hardhat/internal/core/config/config-env';
import './type-extensions';
import { FactoryDeps, ZkSolcConfig } from './types';
import { Artifacts, getArtifactFromContractOutput } from 'hardhat/internal/artifacts';
import { compile } from './compile';
import { zeroxlify } from './utils';

const ZK_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';

extendEnvironment((hre) => {
    if (hre.network.config.zksync) {
        hre.network.zksync = hre.network.config.zksync;

        let artifactsPath = hre.config.paths.artifacts;
        if (!artifactsPath.endsWith('-zk')) {
            artifactsPath = artifactsPath + '-zk';
        }

        let cachePath = hre.config.paths.cache;
        if (!cachePath.endsWith('-zk')) {
            cachePath = cachePath + '-zk';
        }

        // Forcibly update the artifacts object.
        hre.config.paths.artifacts = artifactsPath;
        hre.config.paths.cache = cachePath;
        (hre as any).artifacts = new Artifacts(artifactsPath);
    }
});

subtask(
    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
    async (
        {
            sourceName,
            contractName,
            contractOutput,
        }: {
            sourceName: string;
            contractName: string;
            contractOutput: any;
        },
        hre
    ): Promise<any> => {
        if (hre.network.zksync !== true) {
            return getArtifactFromContractOutput(sourceName, contractName, contractOutput);
        }
        let bytecode: string =
            contractOutput.evm?.bytecode?.object || contractOutput.evm?.deployedBytecode?.object || '';
        bytecode = zeroxlify(bytecode);

        let factoryDeps: FactoryDeps = {};
        let entries: Array<[string, string]> = Object.entries(contractOutput.factoryDependencies || {});
        for (const [hash, dependency] of entries) {
            factoryDeps[zeroxlify(hash)] = dependency;
        }

        return {
            _format: ZK_ARTIFACT_FORMAT_VERSION,
            contractName,
            sourceName,
            abi: contractOutput.abi,
            // technically, zkEVM has no difference between bytecode & deployedBytecode,
            // but both fields are included just in case
            bytecode,
            deployedBytecode: bytecode,
            // zksolc does not support unlinked objects,
            // all external libraries are either linked during compilation or inlined
            linkReferences: {},
            deployedLinkReferences: {},

            // zkSync-specific field
            factoryDeps,
        };
    }
);

subtask(TASK_COMPILE_SOLIDITY_RUN_SOLC, async (args: { input: any; solcPath: string }, hre, runSuper) => {
    if (hre.network.zksync !== true) {
        return runSuper(args);
    }

    const defaultConfig: ZkSolcConfig = {
        version: 'latest',
        compilerSource: 'binary',
        settings: {
            optimizer: {
                enabled: true,
            },
            experimental: {},
        },
    };

    const zksolc = { ...defaultConfig, ...hre.config.zksolc };

    if (hre.config?.zksolc?.settings.libraries) {
        args.input.settings.libraries = hre.config.zksolc.settings.libraries;
    }

    // TODO: If solidity optimizer is not enabled, the libraries are not inlined and
    // we have to manually pass them into zksolc. So for now we force the optimization.
    args.input.settings.optimizer.enabled = true;

    return await compile(zksolc, args.input);
});

// This task searches for the required solc version in the system and downloads it if not found.
// zksolc currently uses solc found in $PATH so this task is not needed for the most part.
// It is overriden to prevent unnecessary downloads.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args: { solcVersion: string }, hre, runSuper) => {
    if (hre.network.zksync !== true) {
        return runSuper(args);
    }

    // return dummy value, it's not used anywhere anyway
    return {
        compilerPath: '',
        isSolsJs: false,
        version: args.solcVersion,
        longVersion: args.solcVersion,
    };
});
