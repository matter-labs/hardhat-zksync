import path from "path";
import fs from "fs";
import {
  TASK_COMPILE_GET_COMPILATION_TASKS,
  TASK_COMPILE_SOLIDITY,
  TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
  TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
  TASK_COMPILE_SOLIDITY_READ_FILE,
  TASK_FLATTEN_GET_DEPENDENCY_GRAPH,
} from "hardhat/builtin-tasks/task-names";
import {
  extendConfig,
  subtask,
  types,
} from "hardhat/internal/core/config/config-env";
import { DependencyGraph } from "hardhat/internal/solidity/dependencyGraph";
import { Parser } from "hardhat/internal/solidity/parse";

import {
  Resolver,
  ResolvedFile,
  ResolvedFilesMap,
} from "hardhat/internal/solidity/resolver";
import { glob } from "hardhat/internal/util/glob";
import { localPathToSourceName } from "hardhat/utils/source-names";
import { getFullyQualifiedName } from "hardhat/utils/contract-names";
import { HardhatError } from "hardhat/internal/core/errors";
import { ERRORS } from "hardhat/internal/core/errors-list";
import { SolidityFilesCache } from "hardhat/builtin-tasks/utils/solidity-files-cache";
import {
  HardhatConfig,
  HardhatUserConfig,
  RunTaskFunction,
  Artifacts,
} from "hardhat/types";

import {
  TASK_COMPILE_ZKSOLC,
  TASK_FLATTEN_ZK,
  TASK_COMPILE_ZK_GET_SOURCE_PATHS,
  TASK_COMPILE_ZK_GET_SOURCE_NAMES,
  TASK_COMPILE_ZK_GET_RESOLVED_FILES,
} from "./task-names";

import "./type-extensions";
import { FactoryDeps, ZkSyncArtifact } from "./types";
import {
  getPragmaAbiEncoder,
  getLicense,
  getFileWithoutImports,
  combineLicenses,
  combinePragmas,
  getPragmaSolidityVersion,
  add0xPrefixIfNecessary,
  pluginError,
} from "./utils";
import { BinaryCompiler, DockerCompiler, ICompiler } from "./compiler";

import { ARTIFACT_FORMAT_VERSION } from "./constants";
import { ZkFilesCache, getZkFilesCachePath } from "./cache";

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    const defaultConfig = {
      version: "latest",
      compilerSource: "binary",
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

    const userPath = userConfig.paths?.flattened;

    let flattened: string;
    if (userPath === undefined) {
      flattened = path.join(config.paths.root, "flattened");
    } else {
      if (path.isAbsolute(userPath)) {
        flattened = userPath;
      } else {
        // We resolve relative paths starting from the project's root.
        // Please keep this convention to avoid confusion.
        flattened = path.normalize(path.join(config.paths.root, userPath));
      }
    }

    config.paths.flattened = flattened;
  }
);

subtask(
  TASK_COMPILE_GET_COMPILATION_TASKS,
  async (_, __, runSuper): Promise<string[]> => {
    // Filter out task to compile solidity, as we replace it.
    const otherTasks = (await runSuper()).filter(
      (task: string) => task !== TASK_COMPILE_SOLIDITY
    );

    return [...otherTasks, TASK_COMPILE_ZKSOLC];
  }
);

subtask(TASK_COMPILE_ZK_GET_SOURCE_NAMES)
  .addParam("sourcePaths", undefined, undefined, types.any)
  .setAction(
    async (
      { sourcePaths }: { sourcePaths: string[] },
      { config }
    ): Promise<string[]> => {
      const sourceNames = await Promise.all(
        sourcePaths.map((p) => localPathToSourceName(config.paths.root, p))
      );

      return sourceNames;
    }
  );

/**
 * Returns a list of absolute paths to all the solidity files in the project.
 * This list doesn't include dependencies, for example solidity files inside
 * node_modules.
 *
 * This is the right task to override to change how the solidity files of the
 * project are obtained.
 */
subtask(
  TASK_COMPILE_ZK_GET_SOURCE_PATHS,
  async (_, { config }): Promise<string[]> => {
    const paths = await glob(path.join(config.paths.flattened, "**/*.sol"));

    return paths;
  }
);

subtask(TASK_COMPILE_ZK_GET_RESOLVED_FILES)
  .addParam("sourceNames", undefined, undefined, types.any)
  .addOptionalParam("solidityFilesCache", undefined, undefined, types.any)
  .setAction(
    async (
      {
        sourceNames,
        solidityFilesCache,
      }: { sourceNames: string[]; solidityFilesCache?: SolidityFilesCache },
      { config, run }
    ): Promise<ResolvedFile[]> => {
      const parser = new Parser(solidityFilesCache);
      const resolver = new Resolver(
        config.paths.root,
        parser,
        (absolutePath: string) =>
          run(TASK_COMPILE_SOLIDITY_READ_FILE, { absolutePath })
      );

      const resolvedFiles = await Promise.all(
        sourceNames.map((sn) => resolver.resolveSourceName(sn))
      );

      return resolvedFiles;
    }
  );

subtask(TASK_FLATTEN_ZK, async (_, { config, run }, __) => {
  const sourcePaths: string[] = await run(
    TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS
  );

  const sourceNames: string[] = await run(
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
    {
      sourcePaths,
    }
  );

  for (const source of sourceNames) {
    const flattenedSolidity = await dedup([source], run);

    const folder = path.join(
      config.paths.flattened,
      path.dirname(source).replace("contracts/", "")
    );
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const fileName = path.join(folder, path.basename(source));
    await fs.promises.writeFile(fileName, flattenedSolidity, "utf8");
  }

  return;
});

subtask(TASK_COMPILE_ZKSOLC, async (_, { config, artifacts, run }, __) => {
  await run(TASK_FLATTEN_ZK, { config, artifacts });

  const sourcePaths: string[] = await run(TASK_COMPILE_ZK_GET_SOURCE_PATHS);

  const sourceNames: string[] = await run(TASK_COMPILE_ZK_GET_SOURCE_NAMES, {
    sourcePaths,
  });

  const zkFilesCachePath = getZkFilesCachePath(config.paths);
  let zkFilesCache = await ZkFilesCache.readFromFile(zkFilesCachePath);

  const resolvedFiles: ResolvedFile[] = await run(
    TASK_COMPILE_ZK_GET_RESOLVED_FILES,
    {
      sourceNames,
      zkFilesCache,
    }
  );

  zkFilesCache = await invalidateCacheMissingArtifacts(
    zkFilesCache,
    artifacts,
    resolvedFiles
  );

  const neededCompilationFiles = resolvedFiles.filter((file) =>
    needsCompilation(file, zkFilesCache)
  );

  let compiler: ICompiler | undefined;
  if (config.zksolc.compilerSource === "binary") {
    compiler = await BinaryCompiler.initialize();
  } else if (config.zksolc.compilerSource === "docker") {
    compiler = await DockerCompiler.initialize(config.zksolc);
  } else {
    throw pluginError(
      `Incorrect compiler source: ${config.zksolc.compilerSource}`
    );
  }

  for (const file of neededCompilationFiles) {
    const processResult = await compiler.compile(
      file.sourceName,
      config.zksolc,
      config.paths
    );

    if (processResult.status === 0) {
      const compilerOutput = JSON.parse(processResult.stdout.toString("utf8"));
      const builtContracts = compilerOutput.contracts;

      for (const artifactId in compilerOutput.contracts) {
        if (compilerOutput.contracts.hasOwnProperty(artifactId)) {
          console.log(`Adding artifact ${artifactId}`);
          const zksolcOutput = builtContracts[artifactId];

          const contractName = artifactIdToContractName(artifactId);
          const artifact = getArtifactFromZksolcOutput(
            file.sourceName,
            contractName,
            zksolcOutput
          );

          await artifacts.saveArtifactAndDebugFile(artifact);

          zkFilesCache.addFile(file.absolutePath, {
            lastModificationDate: file.lastModificationDate.valueOf(),
            contentHash: file.contentHash,
            sourceName: file.sourceName,
            zkSolcConfig: config.zksolc,
            artifacts: [contractName],
          });
        }
      }
    } else {
      console.error("stdout:");
      console.error(processResult.stdout.toString("utf8").trim(), "\n");
      console.error("stderr:");
      console.error(processResult.stderr.toString("utf8").trim(), "\n");
    }
  }

  await zkFilesCache.writeToFile(zkFilesCachePath);
});

/**
 * Checks if the given compilation job needs to be done.
 */
function needsCompilation(file: ResolvedFile, cache: ZkFilesCache): boolean {
  const hasChanged = cache.hasFileChanged(file.absolutePath, file.contentHash);

  if (hasChanged) {
    return true;
  }

  return false;
}

async function dedup(files: string[], run: RunTaskFunction): Promise<string> {
  const licenses = new Map();
  const abis = new Map();
  const solidityVersions = new Map();
  const warnings: string[] = [];

  const dependencyGraph: DependencyGraph = await run(
    TASK_FLATTEN_GET_DEPENDENCY_GRAPH,
    { files }
  );

  const sortedFiles = getSortedFiles(dependencyGraph);

  for (const file of sortedFiles) {
    const abi = getPragmaAbiEncoder(file);
    if (abi !== "") {
      abis.set(file.sourceName, abi);
    }

    const license = getLicense(file);
    if (license !== "") {
      licenses.set(file.sourceName, license);
    }

    const solidityVersion = getPragmaSolidityVersion(file);
    if (solidityVersion !== "") {
      solidityVersions.set(file.sourceName, solidityVersion);
    }
  }

  let flattened = "";

  for (const file of sortedFiles) {
    flattened += `\n\n// File ${file.getVersionedName()}\n`;

    const newFileContent = file.content.rawContent
      .replace(
        licenses.has(file.sourceName) ? licenses.get(file.sourceName) : "",
        ""
      )
      .replace(abis.has(file.sourceName) ? abis.get(file.sourceName) : "", "")
      .replace(
        solidityVersions.has(file.sourceName)
          ? solidityVersions.get(file.sourceName)
          : "",
        ""
      );

    flattened += `\n${getFileWithoutImports(newFileContent)}\n`;
  }

  if (licenses.size > 0) {
    const combined = combineLicenses(licenses);
    flattened = `${combined}\n\n${flattened}`;
  }

  if (solidityVersions.size > 0) {
    flattened = `${combinePragmas(solidityVersions, warnings)}\n\n${flattened}`;
  }

  if (abis.size > 0) {
    flattened = `${combinePragmas(abis, warnings)}\n\n${flattened}`;
  }

  return flattened.trim();
}

function getSortedFiles(dependenciesGraph: DependencyGraph) {
  const tsort = require("tsort");
  const graph = tsort();

  const filesMap: ResolvedFilesMap = {};
  const resolvedFiles = dependenciesGraph.getResolvedFiles();
  resolvedFiles.forEach((f) => (filesMap[f.sourceName] = f));

  for (const [from, deps] of dependenciesGraph.entries()) {
    for (const to of deps) {
      graph.add(to.sourceName, from.sourceName);
    }
  }

  try {
    const topologicalSortedNames: string[] = graph.sort();

    // If an entry has no dependency it won't be included in the graph, so we
    // add them and then dedup the array
    const withEntries = topologicalSortedNames.concat(
      resolvedFiles.map((f) => f.sourceName)
    );

    const sortedNames = [...new Set(withEntries)];
    return sortedNames.map((n) => filesMap[n]);
  } catch (error) {
    if (error instanceof Error) {
      if (error.toString().includes("Error: There is a cycle in the graph.")) {
        throw new HardhatError(ERRORS.BUILTIN_TASKS.FLATTEN_CYCLE, error);
      }
    }

    throw error;
  }
}

async function invalidateCacheMissingArtifacts(
  zkFilesCache: ZkFilesCache,
  artifacts: Artifacts,
  resolvedFiles: ResolvedFile[]
): Promise<ZkFilesCache> {
  for (const file of resolvedFiles) {
    const cacheEntry = zkFilesCache.getEntry(file.absolutePath);

    if (cacheEntry === undefined) {
      continue;
    }

    const { artifacts: emittedArtifacts } = cacheEntry;

    for (const emittedArtifact of emittedArtifacts) {
      const artifactExists = await artifacts.artifactExists(
        getFullyQualifiedName(file.sourceName, emittedArtifact)
      );

      if (!artifactExists) {
        console.log(
          `Invalidate cache for '${file.absolutePath}' because artifact '${emittedArtifact}' doesn't exist`
        );
        zkFilesCache.removeEntry(file.absolutePath);
        break;
      }
    }
  }

  return zkFilesCache;
}

function artifactIdToContractName(file: string) {
  const sourceName = path.basename(file);
  return sourceName.substring(sourceName.indexOf(":") + 1);
}

function getArtifactFromZksolcOutput(
  pathFromCWD: string,
  contractName: string,
  output: any
): ZkSyncArtifact {
  console.log(`Contract name: ${contractName}`);

  // `factory-deps` field may be absent for certain compiled contracts.
  const factoryDeps = output["factory-deps"]
    ? normalizeFactoryDeps(pathFromCWD, output["factory-deps"])
    : {};
  return {
    _format: ARTIFACT_FORMAT_VERSION,
    contractName,
    sourceName: pathFromCWD,
    abi: output.abi,
    bytecode: add0xPrefixIfNecessary(output.bin),
    deployedBytecode: add0xPrefixIfNecessary(output["bin-runtime"]),
    linkReferences: {},
    deployedLinkReferences: {},

    // zkSync-specific fields.
    factoryDeps,
  };
}

function normalizeFactoryDeps(
  pathFromCWD: string,
  factoryDeps: {
    [key: string]: string;
  }
): FactoryDeps {
  // Normalize factory-deps.
  // We need to replace the contract IDs with ones we can easily reference as artifacts.
  // Also we need to add `0x` prefixes to the hashes.
  const normalizedDeps: FactoryDeps = {};
  Object.keys(factoryDeps).forEach((contractHash) => {
    // `SomeDep` part of `SomeContract.sol:SomeDep`.
    const contractName = factoryDeps[contractHash].split(":")[1];

    // All the dependency artifacts will be placed in the same artifact folder as the current contract.
    // So to avoid finding it in the hierarchy of all the artifacts, we just replace the contract path returned by the compiler
    // with the path to the "factory" contract itself.
    const newContractId = `${pathFromCWD}:${contractName}`;
    const prefixedContractHash = add0xPrefixIfNecessary(contractHash);
    normalizedDeps[prefixedContractHash] = newContractId;
  });

  return normalizedDeps;
}
