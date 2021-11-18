import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { Artifact, Artifacts, ProjectPathsConfig } from "hardhat/types";
import { localPathToSourceName } from "hardhat/utils/source-names";
import { spawnSync, spawn } from "child_process";
import path from "path";

import { ZkSolcConfig } from "./types";
import { add0xPrefixIfNecessary } from "./utils";

const ARTIFACT_FORMAT_VERSION = "hh-zksolc-artifact-1";

export async function compile(
  zksolcConfig: ZkSolcConfig,
  paths: ProjectPathsConfig,
  artifacts: Artifacts
) {
  checkCompilerSource(zksolcConfig);
  checkZksolcBinary();

  const files = await getSoliditySources(paths);

  let someContractFailed = false;

  for (const file of files) {
    const pathFromCWD = path.relative(process.cwd(), file);
    const sourceName = await localPathToSourceName(paths.root, file);
    const contractName = pathToContractName(sourceName);

    // TODO: Don't recompile the file if it was already compiled.

    console.log("Compiling", pathFromCWD);

    const processResult = compileWithBinary(file, zksolcConfig);

    if (processResult.status === 0) {
      // TODO: Currently, in the output JSON contract entry is `/path/to/contract/ContractName.sol:ContractName`.
      const zksolcOutput = JSON.parse(processResult.stdout.toString("utf8"))["contracts"][`${file}:${contractName}`];

      const artifact = getArtifactFromZksolcOutput(sourceName, zksolcOutput);

      await artifacts.saveArtifactAndDebugFile(artifact);
    } else {
      console.error("stdout:")
      console.error(processResult.stdout.toString("utf8").trim(), "\n");
      console.error("stderr:")
      console.error(processResult.stderr.toString("utf8").trim(), "\n");
      someContractFailed = true;
    }
  }

  if (someContractFailed) {
    throw pluginError("Compilation failed");
  }
}

function compileWithBinary(
  filePath: string,
  config: ZkSolcConfig
): any {
  const zksolcArguments = [filePath, "--combined-json", "abi,bin,bin-runtime"];
  if (config.settings.optimizer.enabled) {
    zksolcArguments.push("--optimize");
  }

  return spawnSync("zksolc", zksolcArguments);
}

async function getSoliditySources(paths: ProjectPathsConfig) {
  const glob = await import("glob");
  const solFiles = glob.sync(path.join(paths.sources, "**", "*.sol"));

  return solFiles;
}

function pathToContractName(file: string) {
  const sourceName = path.basename(file);
  return sourceName.substring(0, sourceName.indexOf("."));
}

function getArtifactFromZksolcOutput(
  sourceName: string,
  output: any
): Artifact {
  const contractName = pathToContractName(sourceName);

  // TODO: Probably we need to add information about contract CREATE dependencies here
  //       (also check whether it's OK with hardhat approach).
  return {
    _format: ARTIFACT_FORMAT_VERSION, // TODO: Check whether we need it.
    contractName,
    sourceName,
    abi: output["abi"],
    bytecode: add0xPrefixIfNecessary(output["bin"]),
    deployedBytecode: add0xPrefixIfNecessary(output["bin-runtime"]),
    linkReferences: {},
    deployedLinkReferences: {},
  };
}

// Checks whether compiler source is supported.
function checkCompilerSource(config: ZkSolcConfig) {
  if (config.compilerSource !== "binary") {
    throw pluginError(
      `Only 'binary' compile source currently supported, but ${config.compilerSource} is selected`
    );
  }
}

// Checks whether `zksolc` is available in `$PATH`.
function checkZksolcBinary() {
  const inPath = spawnSync("which", ["zksolc"]).status === 0;
  if (!inPath) {
    throw pluginError(
      "`zksolc` binary is either not installed or not in $PATH"
    );
  }
}

// Returns a built plugin exception object.
function pluginError(message: string): NomicLabsHardhatPluginError {
  return new NomicLabsHardhatPluginError(
    "@matterlabs/hardhat-zksync-solc",
    message
  );
}
