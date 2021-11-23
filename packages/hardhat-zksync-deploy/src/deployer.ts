import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";
import { ZkSyncArtifact } from "./types";

import { pluginError } from "./helpers";

const ARTIFACT_FORMAT_VERSION = "hh-zksolc-artifact-1";

/**
 * An entity capable of deploying contracts to the zkSync network.
 */
export class Deployer {
    public hre: HardhatRuntimeEnvironment;

    public constructor(hre: HardhatRuntimeEnvironment) {
        this.hre = hre;
    }

  /**
   * Loads an artifact and verifies that it was compiled by `zksolc\.
   *
   * @param contractNameOrFullyQualifiedName The name of the contract.
   *   It can be a contract bare contract name (e.g. "Token") if it's
   *   unique in your project, or a fully qualified contract name
   *   (e.g. "contract/token.sol:Token") otherwise.
   *
   * @throws Throws an error if a non-unique contract name is used,
   *   indicating which fully qualified names can be used instead.
   *
   * @throws Throws an error if an artifact was not compiled by `zksolc`.
   */
    public async loadArtifact(contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact> {
        const artifact = await this.hre.artifacts.readArtifact(contractNameOrFullyQualifiedName);
        
        // Verify that this artifact was compiled by the zkSync compiler, and not `solc` or `vyper`.
        if (artifact._format != ARTIFACT_FORMAT_VERSION) {
            throw pluginError(`Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc`);
        }
        return artifact as ZkSyncArtifact;
    }

    /**
     * Sends a deploy transaction to the zkSync network.
     * For now, it will use defaults for the transaction parameters:
     * - fee token is ETH.
     * - fee amount is requested automatically from the zkSync server.
     * 
     * @param artifact The previously loaded artifact object.
     * @param constructorArguments List of arguments to be passed to the contract constructor.
     * 
     * @returns A handle for the deploy transaction.
    */
    public async deploy(artifact: Artifact, constructorArguments: any[]): Promise<any> {
        const contractBytecode = artifact.bytecode;

        // TODO:
        // - Form the transaction.
        // - Send it via Web3.
        // - Return a transaction handle.
    }
}
