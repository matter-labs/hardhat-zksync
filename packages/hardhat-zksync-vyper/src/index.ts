import {
    TASK_COMPILE_VYPER_RUN_BINARY,
    TASK_COMPILE_VYPER_GET_BUILD
} from '@nomiclabs/hardhat-vyper/dist/src/task-names';
import { extendEnvironment, extendConfig, subtask } from 'hardhat/internal/core/config/config-env';
import './type-extensions';
import { ZkVyperConfig } from './types';
import { ZkArtifacts } from './artifacts';
import { compile } from './compile';
import { pluginError } from './utils';
import { spawnSync } from 'child_process';

extendConfig((config, userConfig) => {
    const defaultConfig: ZkVyperConfig = {
        version: 'latest',
        compilerSource: 'binary',
        settings: {
            compilerPath: 'zkvyper',
            experimental: {},
        },
    };

    config.zkvyper = { ...defaultConfig, ...userConfig?.zkvyper };
    config.zkvyper.settings = { ...defaultConfig.settings, ...userConfig?.zkvyper?.settings };
});

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
        (hre as any).artifacts = new ZkArtifacts(artifactsPath);
    }
});

subtask(TASK_COMPILE_VYPER_RUN_BINARY, async (args: { inputPaths: string[]; vyperPath: string }, hre, runSuper) => {
    if (hre.network.zksync !== true) {
        return await runSuper(args);
    }

    const compilerOutput = await compile(hre.config.zkvyper, args.inputPaths, args.vyperPath);
    (hre.artifacts as ZkArtifacts).compilerOutput = compilerOutput;

    return compilerOutput;
});

// This task is overriden to:
// - prevent unnecessary vyper downloads when using docker
// - validate zkvyper binary
// - validate vyper version required by zkvyper
subtask(TASK_COMPILE_VYPER_GET_BUILD, async (args: { vyperVersion: string }, hre, runSuper) => {
    if (hre.network.zksync !== true) {
        return await runSuper(args);
    }

    if (hre.config.zkvyper.compilerSource === 'docker') {
        // return dummy value, it's not used anywhere anyway
        return {
            compilerPath: '',
            version: args.vyperVersion,
        };
    }

    const vyperBuild = await runSuper(args);
    const compilerPath = hre.config.zkvyper.settings.compilerPath;

    const versionOutput = spawnSync(compilerPath!, ['--version']);
    const version = versionOutput.stdout?.toString().match(/\d+\.\d+\.\d+/)?.toString();

    if (versionOutput.status !== 0 || version == null) {
        throw pluginError(`Specified zkvyper binary is not found or invalid`);
    }

    return vyperBuild;
});
