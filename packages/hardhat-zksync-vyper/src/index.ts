import {
    TASK_COMPILE_VYPER_RUN_BINARY,
    TASK_COMPILE_VYPER_GET_BUILD,
    TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT,
    TASK_COMPILE_VYPER_LOG_DOWNLOAD_COMPILER_START,
} from '@nomiclabs/hardhat-vyper/dist/src/task-names';
import {
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    TASK_COMPILE_SOLIDITY_LOG_NOTHING_TO_COMPILE,
} from 'hardhat/builtin-tasks/task-names';
import { extendEnvironment, extendConfig, subtask, types } from 'hardhat/internal/core/config/config-env';
import { getCompilersDir } from 'hardhat/internal/util/global-dir';
import { Mutex } from 'hardhat/internal/vendor/await-semaphore';
import './type-extensions';
import { ZkArtifacts } from './artifacts';
import { compile } from './compile';
import { checkSupportedVyperVersions, pluralize } from './utils';
import chalk from 'chalk';
import { CompilationJob } from 'hardhat/types';
import { COMPILING_INFO_MESSAGE, defaultZkVyperConfig, TASK_COMPILE_VYPER_CHECK_ERRORS, TASK_COMPILE_VYPER_LOG_COMPILATION_ERRORS } from './constants';
import { ZkVyperCompilerDownloader } from './compile/downloader';

extendConfig((config, userConfig) => {
    config.zkvyper = { ...defaultZkVyperConfig, ...userConfig?.zkvyper };
    config.zkvyper.settings = { ...defaultZkVyperConfig.settings, ...userConfig?.zkvyper?.settings };
    config.zkvyper.settings.optimizer = { ...defaultZkVyperConfig.settings.optimizer, ...userConfig?.zkvyper?.settings?.optimizer };
});

extendEnvironment((hre) => {
    checkSupportedVyperVersions(hre.config.vyper);

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
subtask(TASK_COMPILE_SOLIDITY_LOG_NOTHING_TO_COMPILE, async () => { });

subtask(TASK_COMPILE_VYPER_RUN_BINARY, async (args: { inputPaths: string[]; vyperPath: string }, hre, runSuper) => {
    if (hre.network.zksync !== true) {
        return await runSuper(args);
    }

    const compilerOutput: any = await compile(
        hre.config.zkvyper,
        args.inputPaths,
        hre.config.paths.sources,
        hre.config.paths.root,
        args.vyperPath
    );

    await hre.run(TASK_COMPILE_VYPER_CHECK_ERRORS, { output: compilerOutput, quiet: true });

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
    const compilersCache = await getCompilersDir();

    const mutex = new Mutex();
    await mutex.use(async () => {
        const zkvyperDownloader = await ZkVyperCompilerDownloader.getDownloaderWithVersionValidated(
            hre.config.zkvyper.version,
            hre.config.zkvyper.settings.compilerPath ?? '',
            compilersCache
        );

        const isZksolcDownloaded = await zkvyperDownloader.isCompilerDownloaded();
        if (!isZksolcDownloaded) {
            await zkvyperDownloader.downloadCompiler();
        }
        hre.config.zkvyper.settings.compilerPath = await zkvyperDownloader.getCompilerPath();
        hre.config.zkvyper.version = await zkvyperDownloader.getVersion();
    });

    console.info(chalk.yellow(COMPILING_INFO_MESSAGE(hre.config.zkvyper.version, args.vyperVersion)));

    return vyperBuild;
});

subtask(
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    async (args: { compilationJobs: CompilationJob[]; quiet: boolean }, hre, runSuper) => {
        if (hre.network.zksync !== true) {
            return await runSuper(args);
        }
        let count = 0;
        for (const job of args.compilationJobs) {
            count += job.getResolvedFiles().filter((file) => job.emitsArtifacts(file)).length;
        }

        hre.network.solcCompilationsNum = count;
    }
);

subtask(
    TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT,
    async (args: { versionGroups: any; quiet: boolean }, hre, runSuper) => {
        const vyperCompilationsNum = Object.values(args.versionGroups).flat().length;

        if (hre.network.zksync !== true) {
            return await runSuper(args);
        }

        if (args.quiet) return;

        if (hre.network.solcCompilationsNum != 0 && vyperCompilationsNum != 0) {
            console.info(
                chalk.green(
                    `Successfully compiled ${hre.network.solcCompilationsNum??0} Solidity ${pluralize(
                        hre.network.solcCompilationsNum,
                        'file'
                    )} and ${vyperCompilationsNum} Vyper ${pluralize(vyperCompilationsNum, 'file')}`
                )
            );
        } else if (hre.network.solcCompilationsNum == 0 && vyperCompilationsNum != 0) {
            console.info(
                chalk.green(
                    `Successfully compiled ${vyperCompilationsNum} Vyper ${pluralize(vyperCompilationsNum, 'file')}`
                )
            );
        } else if (hre.network.solcCompilationsNum != 0 && vyperCompilationsNum == 0) {
            console.info(
                chalk.yellow(
                    `Warning: You imported '@matterlabs/hardhat-zksync-vyper', but there are no .vy files to compile!\nPlease check if any files are missing or if the import is redundant.`
                )
            );
        } else {
            console.info(chalk.green(`Nothing to compile`));
        }
    }
);

subtask(TASK_COMPILE_VYPER_LOG_DOWNLOAD_COMPILER_START)
    .setAction(
        async ({
            quiet,
            isDownloaded,
            vyperVersion,
        }: {
            quiet: boolean;
            isDownloaded: boolean;
            vyperVersion: string;
        }) => {
            if (isDownloaded || quiet) return;

            console.info(chalk.yellow(`Downloading vyper ${vyperVersion}`));
        }
    );

subtask(TASK_COMPILE_VYPER_CHECK_ERRORS)
    .addParam("output", undefined, undefined, types.any)
    .addParam("quiet", undefined, undefined, types.boolean)
    .setAction(
        async ({ output, quiet }: { output: any; quiet: boolean }, { run }) => {
            await run(TASK_COMPILE_VYPER_LOG_COMPILATION_ERRORS, {
                output,
                quiet,
            });
        }
    );

subtask(TASK_COMPILE_VYPER_LOG_COMPILATION_ERRORS)
    .addParam("output", undefined, undefined, types.any)
    .addParam("quiet", undefined, undefined, types.boolean)
    .setAction(async ({ output }: { output: any; quiet: boolean }) => {
        // Iterate over contracts
        for (const contractPath in output) {
            if (contractPath !== "version" && contractPath !== "zk_version") {
                const contract = output[contractPath];
                
                if (contract.warnings && Array.isArray(contract.warnings) && contract.warnings.length > 0) {
                    // Iterate over warnings
                    for (const warning of contract.warnings) {
                        console.warn(
                            (warning.message as string).replace(/^\w+:/, (t) =>
                                chalk.yellow.bold(t)
                            )
                        );
                    }
                }
            }
        }
    });
