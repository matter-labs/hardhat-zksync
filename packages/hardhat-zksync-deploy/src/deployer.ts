import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

const ARTIFACT_FORMAT_VERSION = "hh-zksolc-artifact-1";

export class Deployer {
    public hre: HardhatRuntimeEnvironment;

    public constructor(hre: HardhatRuntimeEnvironment) {
        this.hre = hre;
    }

    public async loadArtifact(artifactId: string): Promise<Artifact> {
        const artifact = await this.hre.artifacts.readArtifact(artifactId);
        
        // Verify that this artifact was compiled by the zkSync compiler, and not `solc` or `vyper`.
        if (artifact._format != ARTIFACT_FORMAT_VERSION) {
            throw pluginError(`Artifact ${artifactId} was not compiled by zksolc`);
        }
        return artifact;
    }
}


// Returns a built plugin exception object.
function pluginError(message: string): NomicLabsHardhatPluginError {
    return new NomicLabsHardhatPluginError(
      "@matterlabs/hardhat-zksync-solc",
      message
    );
  }
  