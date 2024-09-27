import {
    TASK_COMPILE_SOLIDITY_RUN_SOLC,
    TASK_COMPILE_SOLIDITY_RUN_SOLCJS,
    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS,
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_COMPILER_START,
    TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START,
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
    TASK_COMPILE_REMOVE_OBSOLETE_ARTIFACTS,
    TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
    TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_END,
    TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS,
    TASK_COMPILE,
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
} from 'hardhat/builtin-tasks/task-names';
import { extendEnvironment, extendConfig, subtask, task } from 'hardhat/internal/core/config/config-env';
import { getCompilersDir } from 'hardhat/internal/util/global-dir';
import './type-extensions';
import { Artifacts, getArtifactFromContractOutput } from 'hardhat/internal/artifacts';
import { Mutex } from 'hardhat/internal/vendor/await-semaphore';
import fs from 'fs';
import chalk from 'chalk';
import {
    ArtifactsEmittedPerFile,
    CompilationJob,
    CompilerInput,
    CompilerOutput,
    HardhatRuntimeEnvironment,
    RunSuperFunction,
    SolcBuild,
    TaskArguments,
} from 'hardhat/types';
import debug from 'debug';
import { compile } from './compile';
import {
    zeroxlify,
    getZksolcUrl,
    pluralize,
    saltFromUrl,
    generateSolcJSExecutableCode,
    updateDefaultCompilerConfig,
    getZkVmNormalizedVersion,
    updateBreakableCompilerConfig,
    getLatestEraVersion,
} from './utils';
import {
    defaultZkSolcConfig,
    ZKSOLC_BIN_REPOSITORY,
    ZK_ARTIFACT_FORMAT_VERSION,
    COMPILING_INFO_MESSAGE,
    MISSING_LIBRARIES_NOTICE,
    COMPILE_AND_DEPLOY_LIBRARIES_INSTRUCTIONS,
    MISSING_LIBRARY_LINK,
    COMPILING_INFO_MESSAGE_ZKVM_SOLC,
    ZKSOLC_COMPILER_PATH_VERSION,
    TASK_UPDATE_SOLIDITY_COMPILERS,
    TASK_DOWNLOAD_ZKSOLC,
} from './constants';
import { ZksolcCompilerDownloader } from './compile/downloader';
import { ZkVmSolcCompilerDownloader } from './compile/zkvm-solc-downloader';
import {
    SolcMultiUserConfigExtractor,
    SolcSoloUserConfigExtractor,
    SolcStringUserConfigExtractor,
    SolcUserConfigExtractor,
} from './config-extractor';
import { FactoryDeps, ZkSyncCompilerInput } from './types';

const logDebug = debug('hardhat:core:tasks:compile');

const extractors: SolcUserConfigExtractor[] = [
    new SolcStringUserConfigExtractor(),
    new SolcSoloUserConfigExtractor(),
    new SolcMultiUserConfigExtractor(),
];

const zkVmSolcCompilerDownloaderMutex = new Mutex();
const zkSolcCompilerDownloaderMutex = new Mutex();

extendConfig((config, userConfig) => {
    defaultZkSolcConfig.version = userConfig.zksolc?.settings?.compilerPath ? ZKSOLC_COMPILER_PATH_VERSION : 'latest';
    config.zksolc = { ...defaultZkSolcConfig, ...userConfig?.zksolc };
    config.zksolc.settings = { ...defaultZkSolcConfig.settings, ...userConfig?.zksolc?.settings };
    config.zksolc.settings.optimizer = {
        ...defaultZkSolcConfig.settings.optimizer,
        ...userConfig?.zksolc?.settings?.optimizer,
    };
    config.zksolc.settings.libraries = {
        ...defaultZkSolcConfig.settings.libraries,
        ...userConfig?.zksolc?.settings?.libraries,
    };
});

extendEnvironment((hre) => {
    if (hre.network.config.zksync) {
        hre.network.zksync = hre.network.config.zksync;

        let artifactsPath = hre.config.paths.artifacts;
        if (!artifactsPath.endsWith('-zk')) {
            artifactsPath = `${artifactsPath}-zk`;
        }

        let cachePath = hre.config.paths.cache;
        if (!cachePath.endsWith('-zk')) {
            cachePath = `${cachePath}-zk`;
        }

        // Forcibly update the artifacts object.
        hre.config.paths.artifacts = artifactsPath;
        hre.config.paths.cache = cachePath;
        (hre as any).artifacts = new Artifacts(artifactsPath);

        hre.config.solidity.compilers.forEach(async (compiler) =>
            updateDefaultCompilerConfig({ compiler }, hre.config.zksolc),
        );

        for (const [file, compiler] of Object.entries(hre.config.solidity.overrides)) {
            updateDefaultCompilerConfig({ compiler, file }, hre.config.zksolc);
        }
    }
});

task(TASK_COMPILE).setAction(
    async (compilationArgs: any, hre: HardhatRuntimeEnvironment, runSuper: RunSuperFunction<TaskArguments>) => {
        if (hre.network.zksync) {
            await hre.run(TASK_DOWNLOAD_ZKSOLC);
            await hre.run(TASK_UPDATE_SOLIDITY_COMPILERS);
        }

        await runSuper(compilationArgs);
    },
);

subtask(TASK_DOWNLOAD_ZKSOLC, async (_args: any, hre: HardhatRuntimeEnvironment) => {
    if (!hre.network.zksync) {
        return;
    }

    const compilersCache = await getCompilersDir();

    await zkSolcCompilerDownloaderMutex.use(async () => {
        const zksolcDownloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
            hre.config.zksolc.version,
            hre.config.zksolc.settings.compilerPath ?? '',
            compilersCache,
        );

        const isZksolcDownloaded = await zksolcDownloader.isCompilerDownloaded();
        if (!isZksolcDownloaded) {
            await zksolcDownloader.downloadCompiler();
        }

        hre.config.zksolc.settings.compilerPath = zksolcDownloader.getCompilerPath();
        hre.config.zksolc.version = zksolcDownloader.getVersion();
    });
});

subtask(TASK_UPDATE_SOLIDITY_COMPILERS, async (_args: any, hre: HardhatRuntimeEnvironment) => {
    if (!hre.network.zksync) {
        return;
    }

    const userSolidityConfig = hre.userConfig.solidity;

    const extractedConfigs = extractors
        .find((extractor) => extractor.suitable(userSolidityConfig))
        ?.extract(userSolidityConfig);

    const latestEraVersion = await getLatestEraVersion();

    hre.config.solidity.compilers.forEach(async (compiler) =>
        updateBreakableCompilerConfig(
            { compiler },
            hre.config.zksolc,
            latestEraVersion,
            extractedConfigs?.compilers ?? [],
        ),
    );

    for (const [file, compiler] of Object.entries(hre.config.solidity.overrides)) {
        updateBreakableCompilerConfig(
            { compiler, file },
            hre.config.zksolc,
            latestEraVersion,
            extractedConfigs?.overides ?? new Map(),
        );
    }
});

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, async (args: { sourcePaths: string[] }, hre, runSuper) => {
    if (hre.network.zksync !== true) {
        return await runSuper(args);
    }

    if (hre.config.zksolc.settings.forceContractsToCompile) {
        return hre.config.zksolc.settings.forceContractsToCompile;
    }

    const contractsToCompile: string[] | undefined = hre.config.zksolc.settings.contractsToCompile;

    if (!contractsToCompile || contractsToCompile.length === 0) {
        return await runSuper(args);
    }

    const sourceNames: string[] = await runSuper(args);

    return sourceNames.filter((sourceName) =>
        contractsToCompile.some((contractToCompile) => sourceName.includes(contractToCompile)),
    );
});

// This override is needed to invalidate cache when zksolc config is changed.
subtask(TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS, async (args, hre, runSuper) => {
    const { jobs, errors } = await runSuper(args);

    if (hre.network.zksync !== true || hre.config.zksolc.compilerSource !== 'binary') {
        return { jobs, errors };
    }

    jobs.forEach((job: any) => {
        job.solidityConfig.zksolc = hre.config.zksolc;
        job.solidityConfig.zksolc.settings.compilerPath = hre.config.zksolc.settings.compilerPath;

        if (hre.config.zksolc.settings.libraries) {
            job.solidityConfig.settings.libraries = hre.config.zksolc.settings.libraries;
        }
    });

    return { jobs, errors };
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
        hre,
    ): Promise<any> => {
        if (hre.network.zksync !== true) {
            return getArtifactFromContractOutput(sourceName, contractName, contractOutput);
        }
        let bytecode: string =
            contractOutput.evm?.bytecode?.object || contractOutput.evm?.deployedBytecode?.object || '';
        bytecode = zeroxlify(bytecode);

        const factoryDeps: FactoryDeps = {};
        const entries: Array<[string, string]> = Object.entries(contractOutput.factoryDependencies || {});
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

            // ZKsync-specific field
            factoryDeps,
        };
    },
);

subtask(TASK_COMPILE_SOLIDITY_RUN_SOLC, async (args: { input: any; solcPath: string }, hre, runSuper) => {
    if (hre.network.zksync !== true) {
        return await runSuper(args);
    }

    return await compile(hre.config.zksolc, args.input, args.solcPath);
});

subtask(TASK_COMPILE_SOLIDITY_RUN_SOLCJS, async (args: { input: any; solcJsPath: string }, hre, runSuper) => {
    if (hre.network.zksync !== true) {
        return await runSuper(args);
    }

    const solcPath = `${args.solcJsPath}.executable`;
    if (!fs.existsSync(solcPath)) {
        const solcJsExecutableCode = generateSolcJSExecutableCode(args.solcJsPath, process.cwd());
        fs.writeFileSync(solcPath, Buffer.from(solcJsExecutableCode), { encoding: 'utf-8', flag: 'w' });
        fs.chmodSync(solcPath, '755');
    }

    return await compile(hre.config.zksolc, args.input, solcPath);
});

/*
    * This task is overriden to:
    * - use valid zkvm solc version if that is needed and return valid SolcBuild object

*/
subtask(
    TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
    async (
        args: {
            input: CompilerInput;
            quiet: boolean;
            solcVersion: string;
            compilationJob: CompilationJob;
            compilationJobs: CompilationJob[];
            compilationJobIndex: number;
        },
        hre,
        runSuper,
    ): Promise<{ output: CompilerOutput; solcBuild: SolcBuild }> => {
        if (hre.network.zksync !== true) {
            return await runSuper(args);
        }

        const solcBuild: SolcBuild = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, {
            quiet: args.quiet,
            solcVersion: args.solcVersion,
            compilationJob: args.compilationJob,
        });

        await hre.run(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START, {
            compilationJob: args.compilationJob,
            compilationJobs: args.compilationJobs,
            compilationJobIndex: args.compilationJobIndex,
            quiet: args.quiet,
        });

        let output;
        if (solcBuild.isSolcJs) {
            output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_SOLCJS, {
                input: args.input,
                solcJsPath: solcBuild.compilerPath,
            });
        } else {
            output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_SOLC, {
                input: args.input,
                solcPath: solcBuild.compilerPath,
            });
        }

        await hre.run(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_END, {
            compilationJob: args.compilationJob,
            compilationJobs: args.compilationJobs,
            compilationJobIndex: args.compilationJobIndex,
            output,
            quiet: args.quiet,
        });

        return { output, solcBuild };
    },
);

// This task is overriden to:
// - prevent unnecessary solc downloads when using docker
// - download zksolc binary if needed
// - validate zksolc binary
subtask(
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
    async (args: { solcVersion: string; compilationJob: CompilationJob }, hre, runSuper) => {
        if (hre.network.zksync !== true) {
            return await runSuper(args);
        }

        if (hre.config.zksolc.compilerSource === 'docker') {
            // Versions are wrong here when using docker, because there is no
            // way to know them beforehand except to run the docker image, which
            // adds 5-10 seconds to startup time. We cannot read them from artifacts,
            // since that would make cache invalid every time, if the version is
            // different from the one in the docker image.
            //
            // If you wish to know the actual versions from build-info files,
            // please look at `output.version`, `output.long_version`
            // and `output.zk_version` in the generated JSON.
            return {
                compilerPath: '',
                isSolcJs: false,
                version: args.solcVersion,
                longVersion: '',
            };
        }
        const compiler = args.compilationJob?.getSolcConfig();

        if (compiler && compiler.eraVersion) {
            const compilersCache = await getCompilersDir();
            let path: string = '';
            let version: string = '';
            let normalizedVersion: string = '';

            await zkVmSolcCompilerDownloaderMutex.use(async () => {
                const zkVmSolcCompilerDownloader = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                    compiler.eraVersion!,
                    compiler.version,
                    compilersCache,
                );

                const isZksolcDownloaded = await zkVmSolcCompilerDownloader.isCompilerDownloaded();
                if (!isZksolcDownloaded) {
                    await zkVmSolcCompilerDownloader.downloadCompiler();
                }

                path = zkVmSolcCompilerDownloader.getCompilerPath();
                version = zkVmSolcCompilerDownloader.getVersion();
                normalizedVersion = getZkVmNormalizedVersion(
                    zkVmSolcCompilerDownloader.getSolcVersion(),
                    zkVmSolcCompilerDownloader.getZkVmSolcVersion(),
                );
            });
            console.info(chalk.yellow(COMPILING_INFO_MESSAGE_ZKVM_SOLC(hre.config.zksolc.version, version)));

            return {
                compilerPath: path,
                isSolcJs: false,
                version,
                longVersion: normalizedVersion,
            };
        } else {
            const solcBuild = await runSuper(args);

            console.info(chalk.yellow(COMPILING_INFO_MESSAGE(hre.config.zksolc.version, args.solcVersion)));
            return solcBuild;
        }
    },
);

subtask(
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    async ({ compilationJobs }: { compilationJobs: CompilationJob[] }, hre, _runSuper) => {
        if (hre.config.zksolc.settings.areLibrariesMissing) {
            console.info(chalk.yellow(MISSING_LIBRARIES_NOTICE));
            console.info(chalk.red(COMPILE_AND_DEPLOY_LIBRARIES_INSTRUCTIONS));
            console.info(chalk.yellow(MISSING_LIBRARY_LINK));
        } else {
            let count = 0;
            for (const job of compilationJobs) {
                count += job.getResolvedFiles().filter((file) => job.emitsArtifacts(file)).length;
            }

            if (count > 0) {
                console.info(chalk.green(`Successfully compiled ${count} Solidity ${pluralize(count, 'file')}`));
            }
        }
    },
);

subtask(TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_COMPILER_START).setAction(
    async ({
        isCompilerDownloaded,
        solcVersion,
    }: {
        isCompilerDownloaded: boolean;
        quiet: boolean;
        solcVersion: string;
    }) => {
        if (isCompilerDownloaded) {
            return;
        }

        console.info(chalk.yellow(`Downloading solc ${solcVersion}`));
    },
);

subtask(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START).setAction(
    async ({
        compilationJob,
    }: {
        compilationJob: CompilationJob;
        compilationJobs: CompilationJob[];
        compilationJobIndex: number;
    }) => {
        const count = compilationJob.getResolvedFiles().length;
        if (count > 0) {
            console.info(chalk.yellow(`Compiling ${count} Solidity ${pluralize(count, 'file')}`));
        }
    },
);

subtask(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS).setAction(
    async (
        {
            compilationJob,
            input,
            output,
            solcBuild,
        }: {
            compilationJob: CompilationJob;
            input: CompilerInput;
            output: CompilerOutput;
            solcBuild: SolcBuild;
        },
        { artifacts, run, network },
        runSuper,
    ): Promise<{
        artifactsEmittedPerFile: ArtifactsEmittedPerFile;
    }> => {
        if (network.zksync !== true) {
            return await runSuper({
                compilationJob,
                input,
                output,
                solcBuild,
            });
        }

        const version: string = compilationJob.getSolcConfig().eraVersion
            ? getZkVmNormalizedVersion(
                  compilationJob.getSolcConfig().version,
                  compilationJob.getSolcConfig().eraVersion!,
              )
            : compilationJob.getSolcConfig().version;

        const pathToBuildInfo = await artifacts.saveBuildInfo(version, solcBuild.longVersion, input, output);

        const artifactsEmittedPerFile: ArtifactsEmittedPerFile = await Promise.all(
            compilationJob
                .getResolvedFiles()
                .filter((f) => compilationJob.emitsArtifacts(f))
                .map(async (file) => {
                    const artifactsEmitted = await Promise.all(
                        Object.entries(output.contracts?.[file.sourceName] ?? {}).map(
                            async ([contractName, contractOutput]) => {
                                logDebug(`Emitting artifact for contract '${contractName}'`);
                                const artifact = await run(TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT, {
                                    sourceName: file.sourceName,
                                    contractName,
                                    contractOutput,
                                });

                                await artifacts.saveArtifactAndDebugFile(artifact, pathToBuildInfo);

                                return artifact.contractName;
                            },
                        ),
                    );

                    return {
                        file,
                        artifactsEmitted,
                    };
                }),
        );

        return { artifactsEmittedPerFile };
    },
);

subtask(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT, async (taskArgs, hre, runSuper) => {
    const compilerInput: ZkSyncCompilerInput = await runSuper(taskArgs);
    if (hre.network.zksync !== true) {
        return compilerInput;
    }

    if (hre.config.zksolc.settings.suppressedErrors && hre.config.zksolc.settings.suppressedErrors.length > 0) {
        compilerInput.suppressedErrors = hre.config.zksolc.settings.suppressedErrors;
    }

    if (hre.config.zksolc.settings.suppressedWarnings && hre.config.zksolc.settings.suppressedWarnings.length > 0) {
        compilerInput.suppressedWarnings = hre.config.zksolc.settings.suppressedWarnings;
    }

    return compilerInput;
});

subtask(TASK_COMPILE_REMOVE_OBSOLETE_ARTIFACTS, async (taskArgs, hre, runSuper) => {
    if (hre.network.zksync !== true || !hre.config.zksolc.settings.areLibrariesMissing) {
        return await runSuper(taskArgs);
    }

    // Delete all artifacts and cache files because there are missing libraries and the compilation output is invalid.
    const artifactsDir = hre.config.paths.artifacts;
    const cacheDir = hre.config.paths.cache;

    fs.rmSync(artifactsDir, { recursive: true });
    fs.rmSync(cacheDir, { recursive: true });
});

export { getZksolcUrl, ZKSOLC_BIN_REPOSITORY, saltFromUrl };
