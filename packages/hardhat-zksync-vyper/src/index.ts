import {
    TASK_COMPILE_VYPER_RUN_BINARY,
    TASK_COMPILE_VYPER_GET_BUILD,
    TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT,
    TASK_COMPILE_VYPER,
    TASK_COMPILE_VYPER_READ_FILE,
    TASK_COMPILE_VYPER_GET_SOURCE_PATHS,
    TASK_COMPILE_VYPER_GET_SOURCE_NAMES,
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
import chalk from 'chalk';
import { CompilationJob } from 'hardhat/types';

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

    const compilerOutput: any = await compile(
        hre.config.zkvyper,
        args.inputPaths,
        hre.config.paths.sources,
        args.vyperPath
    );

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

subtask(
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    async ({ compilationJobs }: { compilationJobs: CompilationJob[] }, hre) => {
        let count = 0;
        for (const job of compilationJobs) {
            count += job.getResolvedFiles().filter((file) => job.emitsArtifacts(file)).length;
        }

        hre.network.solcCompilationsNum = count;
    }
);

subtask(TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT, async ({ versionGroups, quiet }, hre) => {
    const vyperCompilationsNum = Object.entries(versionGroups).length;

    if (quiet) return;

    if (hre.network.solcCompilationsNum != 0 && vyperCompilationsNum != 0) {
        console.info(
            chalk.green(
                `Successfully compiled ${hre.network.solcCompilationsNum} Solidity ${pluralize(
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
});

import { VyperFilesCache } from './cache';
import { getVyperFilesCachePath } from './cache';
import { Parser } from './parser';
import { ResolvedFile, Resolver } from './resolver';
import { assertPluginInvariant, getArtifactFromVyperOutput, getLogger, VyperPluginError } from './util';
// import '@nomiclabs/hardhat-vyper/src/type-extensions';
import type { Artifacts as ArtifactsImpl } from 'hardhat/internal/artifacts';
import type { Artifacts } from 'hardhat/types/artifacts';
import type { VyperOutput, VyperBuild } from '@nomiclabs/hardhat-vyper/src/types';

import * as os from 'os';
import semver from 'semver';

const log = getLogger('tasks:compile');

subtask(TASK_COMPILE_VYPER, async ({ quiet }: { quiet: boolean }, { artifacts, config, run }) => {
    const sourcePaths: string[] = await run(TASK_COMPILE_VYPER_GET_SOURCE_PATHS);

    const sourceNames: string[] = await run(TASK_COMPILE_VYPER_GET_SOURCE_NAMES, { sourcePaths });

    const vyperFilesCachePath = getVyperFilesCachePath(config.paths);
    let vyperFilesCache = await VyperFilesCache.readFromFile(vyperFilesCachePath);

    const parser = new Parser(vyperFilesCache);
    const resolver = new Resolver(config.paths.root, parser, (absolutePath: string) =>
        run(TASK_COMPILE_VYPER_READ_FILE, { absolutePath })
    );

    const resolvedFiles = await Promise.all(sourceNames.map(resolver.resolveSourceName));

    vyperFilesCache = await invalidateCacheMissingArtifacts(vyperFilesCache, artifacts, resolvedFiles);

    const configuredVersions = config.vyper.compilers.map(({ version }) => version);

    const versionGroups: Record<string, ResolvedFile[]> = {};
    const unmatchedFiles: ResolvedFile[] = [];

    for (const file of resolvedFiles) {
        const hasChanged = vyperFilesCache.hasFileChanged(file.absolutePath, file.contentHash, {
            version: file.content.versionPragma,
        });

        if (!hasChanged) continue;

        const maxSatisfyingVersion = semver.maxSatisfying(configuredVersions, file.content.versionPragma);

        // check if there are files that don't match any configured compiler
        // version
        if (maxSatisfyingVersion === null) {
            unmatchedFiles.push(file);
            continue;
        }

        if (versionGroups[maxSatisfyingVersion] === undefined) {
            versionGroups[maxSatisfyingVersion] = [file];
            continue;
        }

        versionGroups[maxSatisfyingVersion].push(file);
    }

    if (unmatchedFiles.length > 0) {
        const list = unmatchedFiles
            .map((file) => `  * ${file.sourceName} (${file.content.versionPragma})`)
            .join(os.EOL);

        throw new VyperPluginError(
            `The Vyper version pragma statement in ${
                unmatchedFiles.length > 1 ? 'these files' : 'this file'
            } doesn't match any of the configured compilers in your config. Change the pragma or configure additional compiler versions in your hardhat config.

${list}`
        );
    }

    for (const [vyperVersion, files] of Object.entries(versionGroups)) {
        const vyperBuild: VyperBuild = await run(TASK_COMPILE_VYPER_GET_BUILD, {
            quiet,
            vyperVersion,
        });

        log(`Compiling ${files.length} files for Vyper version ${vyperVersion}`);

        const { version, ...contracts }: VyperOutput = await run(TASK_COMPILE_VYPER_RUN_BINARY, {
            inputPaths: files.map(({ absolutePath }) => absolutePath),
            vyperPath: vyperBuild.compilerPath,
        });

        for (const [sourceName, output] of Object.entries(contracts)) {
            const artifact = getArtifactFromVyperOutput(sourceName, output);
            await artifacts.saveArtifactAndDebugFile(artifact);

            const file = files.find((f) => f.sourceName === sourceName);
            assertPluginInvariant(file !== undefined, 'File should always be found');

            vyperFilesCache.addFile(file.absolutePath, {
                lastModificationDate: file.lastModificationDate.valueOf(),
                contentHash: file.contentHash,
                sourceName: file.sourceName,
                vyperConfig: { version },
                versionPragma: file.content.versionPragma,
                artifacts: [artifact.contractName],
            });
        }
    }

    const allArtifacts = vyperFilesCache.getEntries();

    // We know this is the actual implementation, so we use some
    // non-public methods here.
    const artifactsImpl = artifacts as ArtifactsImpl;
    artifactsImpl.addValidArtifacts(allArtifacts);

    await vyperFilesCache.writeToFile(vyperFilesCachePath);

    await run(TASK_COMPILE_VYPER_LOG_COMPILATION_RESULT, {
        versionGroups,
        quiet,
    });
});

import { getFullyQualifiedName } from 'hardhat/utils/contract-names';

async function invalidateCacheMissingArtifacts(
    vyperFilesCache: VyperFilesCache,
    artifacts: Artifacts,
    resolvedFiles: ResolvedFile[]
): Promise<VyperFilesCache> {
    for (const file of resolvedFiles) {
        const cacheEntry = vyperFilesCache.getEntry(file.absolutePath);

        if (cacheEntry === undefined) {
            continue;
        }

        const { artifacts: emittedArtifacts } = cacheEntry;

        for (const emittedArtifact of emittedArtifacts) {
            const artifactExists = await artifacts.artifactExists(
                getFullyQualifiedName(file.sourceName, emittedArtifact)
            );

            if (!artifactExists) {
                log(`Invalidate cache for '${file.absolutePath}' because artifact '${emittedArtifact}' doesn't exist`);
                vyperFilesCache.removeEntry(file.absolutePath);
                break;
            }
        }
    }

    return vyperFilesCache;
}
