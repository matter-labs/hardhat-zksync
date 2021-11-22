import * as path from "path";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { readFileSync } from "fs";

const ARTIFACT_FORMAT_VERSION = "hh-zksolc-artifact-1";

// Loads artifacts for compiled contracts and validates them.
async function loadArtifacts(artifactsFolder?: string): Promise<any> {
  const folder = artifactsFolder ?? path.join(process.cwd(), "artifacts");
  const artifacts = await loadJsonFiles(folder);

  // Dictionary `Contract name` -> `
  const artifactMapping = {};

  for (const artifact in artifacts) {
    const contents = readFileSync(artifact, { encoding: "utf-8" });
    validateArtifact(contents);
  }

  return undefined;
}

// Loads all the JSON files from the artifacts folder.
async function loadJsonFiles(artifactsFolder: string) {
  const glob = await import("glob");
  const jsonFiles = glob.sync(path.join(artifactsFolder, "**", "*.json"));

  return jsonFiles;
}

// Checks whether artifact was compiled by the zkSync hardhat plugin.
// It's needed to not use artifacts compiled by normal `solc` or `vyper` or whatever.
function validateArtifact(artifact: any) {
  if (artifact._format !== ARTIFACT_FORMAT_VERSION) {
    throw pluginError("Artifact wasn't compiled by zksolc");
  }
}

// Returns a built plugin exception object.
function pluginError(message: string): NomicLabsHardhatPluginError {
  return new NomicLabsHardhatPluginError(
    "@matterlabs/hardhat-zksync-solc",
    message
  );
}
