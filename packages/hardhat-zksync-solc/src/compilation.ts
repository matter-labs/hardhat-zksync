import { Artifacts, ProjectPathsConfig } from "hardhat/types";
import path from "path";

import { ResolvedFile } from "hardhat/internal/solidity/resolver";
import { FactoryDeps, ZkSolcConfig, ZkSyncArtifact } from "./types";
import { add0xPrefixIfNecessary, pluginError } from "./utils";
import { BinaryCompiler, DockerCompiler, ICompiler } from "./compiler";

const ARTIFACT_FORMAT_VERSION = "hh-zksolc-artifact-1";

export async function compile(
  zksolcConfig: ZkSolcConfig,
  paths: ProjectPathsConfig,
  files: ResolvedFile[],
  artifacts: Artifacts
) {
  let compiler: ICompiler | undefined;
  if (zksolcConfig.compilerSource === "binary") {
    compiler = await BinaryCompiler.initialize();
  } else if (zksolcConfig.compilerSource === "docker") {
    compiler = await DockerCompiler.initialize(zksolcConfig);
  } else {
    throw pluginError(
      `Incorrect compiler source: ${zksolcConfig.compilerSource}`
    );
  }

  const failures = [];

  for (const file of files) {
    const processResult = await compiler.compile(
      file.sourceName,
      zksolcConfig,
      paths
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
        }
      }
    } else {
      console.error("stdout:");
      console.error(processResult.stdout.toString("utf8").trim(), "\n");
      console.error("stderr:");
      console.error(processResult.stderr.toString("utf8").trim(), "\n");
      failures.push(file.sourceName);
    }
  }

  if (failures.length > 0) {
    throw pluginError(`Compilation failed ${failures}`);
  }
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
