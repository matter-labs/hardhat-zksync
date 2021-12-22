const rimraf = require("rimraf");
import path from "path";
import fs from "fs"
import {
  TASK_COMPILE_GET_COMPILATION_TASKS,
  TASK_COMPILE_SOLIDITY,
  TASK_FLATTEN_GET_DEPENDENCY_GRAPH,
} from "hardhat/builtin-tasks/task-names";
import { extendConfig, subtask, types } from "hardhat/internal/core/config/config-env";
import { DependencyGraph } from "hardhat/internal/solidity/dependencyGraph";
import { getPackageJson } from "hardhat/internal/util/packageInfo";
import { ResolvedFile, ResolvedFilesMap } from "hardhat/internal/solidity/resolver";
import { HardhatError } from "hardhat/internal/core/errors";
import { ERRORS } from "hardhat/internal/core/errors-list";
import { RunTaskFunction } from "hardhat/types";

import { TASK_COMPILE_ZKSOLC } from "./task-names";
import "./type-extensions";
import {getPragmaAbiEncoder, getLicense, getFileWithoutImports, combineLicenses, combinePragmas, getPragmaSolidityVersion} from "./utils";

extendConfig((config) => {
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
    }
  };
  config.zksolc = { ...defaultConfig, ...config.zksolc };
});

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

function getSubunits(files: string[], base: string) {
  let results = new Map<string, string[]>();
  for (const file of files) {
    let props = path.parse(file);
    let relative = path.relative(base, props.dir);
    if (results.has(relative)) {
      let t = results.get(relative)!;
      t.push(props.base);
      results.set(relative, t);
    } else {
      results.set(relative, [props.base]);
    }
  }

  return results
}

function makeDirComplex(base: string, subdirPath: string) {
  const pp = subdirPath.split(path.sep);
  let current = base;
  for (const p of pp) {
    const ppp = path.join(current, p);
    if (!fs.existsSync(ppp)){
      fs.mkdirSync(ppp);
    }
    current = ppp;
  }
}

// subtask(TASK_COMPILE_ZKSOLC, async (_, { config, artifacts, run}, __) => {
//   const { compile, getSoliditySources } = await import("./compilation");

//   // save file to temporary dir, or cleanup after the last time
//   const dir = path.join(config.paths.sources, "tmp");
//   if (fs.existsSync(dir)){
//     rimraf.sync(dir);
//   }

//   const files = await getSoliditySources(config.paths.sources);
//   const [flattened, warnings] = await dedup(files, run);
//   for (const warning of warnings) {
//     console.warn(warning);
//   }

//   fs.mkdirSync(dir);

//   const fileName = path.join(dir, "Flattened.sol");
//   if (fs.existsSync(fileName)){
//     fs.unlinkSync(fileName);
//   }

//   await fs.promises.writeFile(fileName, flattened, "utf8");

//   // update path
//   config.paths.sources = dir;

//   // This plugin is experimental, so this task isn't split into multiple
//   // subtasks yet.
//   await compile(config.zksolc, config.paths, artifacts);
// });

subtask(TASK_COMPILE_ZKSOLC, async (_, { config, artifacts, run}, __) => {
  const { compile, getSoliditySources, getSoliditySourcesNonRecursive } = await import("./compilation");

  // save file to temporary dir, or cleanup after the last time
  const dir = path.join(config.paths.sources, "tmp");
  if (fs.existsSync(dir)){
    rimraf.sync(dir);
  }

  const files = await getSoliditySources(config.paths.sources);
  const subunits = getSubunits(files, config.paths.sources);

  fs.mkdirSync(dir);

  for (const [subunit, _] of subunits) {
    const subunitPath = path.join(config.paths.sources, subunit);
    let subunitFiles = await getSoliditySources(subunitPath);
    if (subunit === "") {
      // do not walk over subfolders
      subunitFiles = await getSoliditySourcesNonRecursive(subunitPath);
    }
    const [flattened, warnings] = await dedup(subunitFiles, run);
    for (const warning of warnings) {
      console.warn(warning);
    }

    const subunitDir = path.join(dir, subunit);
    makeDirComplex(dir, subunit);
    const fileName = path.join(subunitDir, "Flattened.sol");
    if (fs.existsSync(fileName)){
      fs.unlinkSync(fileName);
    }

    await fs.promises.writeFile(fileName, flattened, "utf8");
  }

  // update path
  config.paths.sources = dir;

  // This plugin is experimental, so this task isn't split into multiple
  // subtasks yet.
  await compile(config.zksolc, config.paths, artifacts);
});

async function dedup(files: string[], run: RunTaskFunction): Promise<[string, string[]]> {
    const dependencyGraph: DependencyGraph = await run(
      TASK_FLATTEN_GET_DEPENDENCY_GRAPH,
      { files }
    );
    let flattened = "";

    if (dependencyGraph.getResolvedFiles().length === 0) {
      return [flattened, []];
    }

    // const packageJson = await getPackageJson();
    // flattened += `// Sources flattened with hardhat v${packageJson.version} https://hardhat.org`;

    const sortedFiles = getSortedFiles(dependencyGraph);
    const licenses = new Map();
    const abis = new Map();
    const solidity_versions = new Map();
    let warnings : string[] = [];

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
        solidity_versions.set(file.sourceName, solidityVersion);
      }
    }

    for (const file of sortedFiles) {
      flattened += `\n\n// File ${file.getVersionedName()}\n`;

      // if (abis.size > 0 && !abis.has(file.sourceName)) {
      //   warnings.push(`MISSING PRAGMA: File ${file.getVersionedName()} needs a pragma`);
      // }

      if (licenses.size > 0 && !licenses.has(file.sourceName)) {
        warnings.push(`MISSING LICENSE: File ${file.getVersionedName()} needs a license`)
      }

      if (solidity_versions.size > 0 && !solidity_versions.has(file.sourceName)) {
        warnings.push(`MISSING SOLIDITY VERSION: File ${file.getVersionedName()} needs a solidity version`)
      }

      const newFileContent = file.content.rawContent
        .replace(
          licenses.has(file.sourceName) ? licenses.get(file.sourceName) : "",
          ""
        )
        .replace(
          abis.has(file.sourceName) ? abis.get(file.sourceName) : "",
          ""
        )
        .replace(
          solidity_versions.has(file.sourceName) ? solidity_versions.get(file.sourceName) : "",
          ""
        );

      flattened += `\n${getFileWithoutImports(newFileContent)}\n`;
    }

    if (licenses.size > 0) {
      const combined = combineLicenses(licenses);
      flattened = `${combined}\n\n${flattened}`;
    }

    if (solidity_versions.size > 0) {
      flattened = `${combinePragmas(solidity_versions, warnings)}\n\n${flattened}`;
    }
    
    if (abis.size > 0) {
      flattened = `${combinePragmas(abis, warnings)}\n\n${flattened}`;
    }

    return [flattened.trim(), warnings];
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
    } catch (error: any) {
      if (error.toString().includes("Error: There is a cycle in the graph.")) {
        throw new HardhatError(ERRORS.BUILTIN_TASKS.FLATTEN_CYCLE, error);
      }
      // eslint-disable-next-line @nomiclabs/hardhat-internal-rules/only-hardhat-error
      throw error;
    }
  }
