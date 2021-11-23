import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { Artifacts, ProjectPathsConfig } from "hardhat/types";
import { spawnSync } from "child_process";
import path from "path";

import { ZkSolcConfig, ZkSyncArtifact } from "./types";
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

    // TODO: Don't recompile the file if it was already compiled.

    console.log("Compiling", pathFromCWD);

    const processResult = compileWithBinary(file, zksolcConfig);

    if (processResult.status === 0) {
      const compilerOutput = JSON.parse(processResult.stdout.toString("utf8"));
      const builtContracts = compilerOutput.contracts;

      for (const artifactId in compilerOutput.contracts) {
        console.log(`Adding artifact ${artifactId}`);
        const zksolcOutput = builtContracts[artifactId];

        const contractName = artifactIdToContractName(artifactId);
        const artifact = getArtifactFromZksolcOutput(
          pathFromCWD,
          contractName,
          zksolcOutput
        );

        await artifacts.saveArtifactAndDebugFile(artifact);
      }
    } else {
      console.error("stdout:");
      console.error(processResult.stdout.toString("utf8").trim(), "\n");
      console.error("stderr:");
      console.error(processResult.stderr.toString("utf8").trim(), "\n");
      someContractFailed = true;
    }
  }

  if (someContractFailed) {
    throw pluginError("Compilation failed");
  }
}

function compileWithBinary(filePath: string, config: ZkSolcConfig): any {
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

  // TODO: We need to add information about contract CREATE dependencies.
  return {
    _format: ARTIFACT_FORMAT_VERSION, // TODO: Check whether we need it.
    contractName,
    sourceName: pathFromCWD,
    abi: output.abi,
    bytecode: add0xPrefixIfNecessary(output.bin),
    deployedBytecode: add0xPrefixIfNecessary(output["bin-runtime"]),
    linkReferences: {},
    deployedLinkReferences: {},

    // zkSync-specific fields.
    factoryDeps: { a: "b" },
    sourceMapping: "",
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
