import {
    TASK_COMPILE_VYPER_RUN_BINARY,
    TASK_COMPILE_VYPER_GET_BUILD,
    TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT,
} from '@nomiclabs/hardhat-vyper/dist/src/task-names';
import {
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    TASK_COMPILE_SOLIDITY_LOG_NOTHING_TO_COMPILE,
} from 'hardhat/builtin-tasks/task-names';
import { extendEnvironment, extendConfig, subtask } from 'hardhat/internal/core/config/config-env';
import './type-extensions';
import { ZkVyperConfig } from './types';
import { ZkArtifacts } from './artifacts';
import { compile } from './compile';
import { pluginError, getZkvyperUrl, getZkvyperPath, pluralize } from './utils';
import { spawnSync } from 'child_process';
import { download } from 'hardhat/internal/util/download';
import fs from 'fs';
import { SOLIDITY_EXTENSION } from './constants';
import chalk from 'chalk';

const LATEST_VERSION = '1.2.0';

extendConfig((config, userConfig) => {
    const defaultConfig: ZkVyperConfig = {
        version: LATEST_VERSION,
        compilerSource: 'binary',
        settings: {
            compilerPath: '',
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

// If there're no .sol files to compile - that's ok.
subtask(TASK_COMPILE_SOLIDITY_LOG_NOTHING_TO_COMPILE, async () => {});

subtask(TASK_COMPILE_VYPER_RUN_BINARY, async (args: { inputPaths: string[]; vyperPath: string }, hre, runSuper) => {
    if (hre.network.zksync !== true) {
        return await runSuper(args);
    }

    const compilerOutput = await compile(hre.config.zkvyper, args.inputPaths, hre.config.paths.sources, args.vyperPath);

    delete compilerOutput.zk_version;
    delete compilerOutput.long_version;

    if (compilerOutput.__VYPER_FORWARDER_CONTRACT) {
        (hre.artifacts as ZkArtifacts).forwarderOutput = compilerOutput.__VYPER_FORWARDER_CONTRACT;
        delete compilerOutput.__VYPER_FORWARDER_CONTRACT;
    }

    (hre.artifacts as ZkArtifacts).compilerOutput = compilerOutput;

    return compilerOutput;
});

// This task is overriden to:
// - prevent unnecessary vyper downloads when using docker
// - download zkvyper binary if needed
// - validate zkvyper binary
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
    let compilerPath = hre.config.zkvyper.settings.compilerPath;

    if (compilerPath) {
        const versionOutput = spawnSync(compilerPath, ['--version']);
        const version = versionOutput.stdout
            ?.toString()
            .match(/\d+\.\d+\.\d+/)
            ?.toString();

        if (versionOutput.status !== 0 || version == null) {
            throw pluginError(`Specified zkvyper binary is not found or invalid`);
        }
    } else {
        compilerPath = await getZkvyperPath(hre.config.zkvyper.version);
        if (!fs.existsSync(compilerPath)) {
            console.info(chalk.yellow(`Downloading zkvyper ${hre.config.zkvyper.version}`));
            try {
                await download(getZkvyperUrl(hre.config.zkvyper.version), compilerPath);
                fs.chmodSync(compilerPath, '755');
                console.info(chalk.green(`zkvyper version ${hre.config.zkvyper.version} successfully downloaded.`));
            } catch (e: any) {
                throw pluginError(e.message.split('\n')[0]);
            }
        }
    }

    return vyperBuild;
});

// This task is overriden since TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT logs both solidity and vyper compiled contracts:
subtask(TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT, async () => {});

subtask(TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT, async ({ versionGroups, quiet }, hre) => {
    const vyperCompilationsNum = Object.entries(versionGroups).length;

    if (quiet) return;

    let solcCompilationsNum = 0;

    // We can ask for all compiled contracts since this task is run after all other compilation tasks for both solc and vyper
    const allContractName = await hre.artifacts.getAllFullyQualifiedNames();

    allContractName.forEach((fullyQualifiedName) => {
        const contractName = fullyQualifiedName.split(':')[0];
        if (contractName.slice(-4) === SOLIDITY_EXTENSION) solcCompilationsNum++;
    });

    if (solcCompilationsNum != 0 && vyperCompilationsNum != 0) {
        console.info(
            chalk.green(
                `Successfully compiled ${solcCompilationsNum} Solidity ${pluralize(
                    solcCompilationsNum,
                    'file'
                )} and ${vyperCompilationsNum} Vyper ${pluralize(vyperCompilationsNum, 'file')}`
            )
        );
    } else if (vyperCompilationsNum != 0) {
        console.info(
            chalk.green(
                `Successfully compiled ${vyperCompilationsNum} Vyper ${pluralize(vyperCompilationsNum, 'file')}`
            )
        );
    } else if (solcCompilationsNum != 0) {
        console.info(
            chalk.green(
                `Successfully compiled ${solcCompilationsNum} Solidity ${pluralize(solcCompilationsNum, 'file')}`
            )
        );
        console.info(
            chalk.yellow(
                `Warning: You imported '@matterlabs/hardhat-zksync-vyper', but there are no .vy files to compile!\nPlease check if any files are missing or if the import is redundant.`
            )
        );
    }
});
