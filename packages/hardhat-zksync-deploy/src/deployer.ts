import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";

import { ZkSyncArtifact } from "./types";
import { pluginError } from "./helpers";

const ARTIFACT_FORMAT_VERSION = "hh-zksolc-artifact-1";

/**
 * An entity capable of deploying contracts to the zkSync network.
 */
export class Deployer {
  public hre: HardhatRuntimeEnvironment;
  public zkWallet: Wallet;

  constructor(hre: HardhatRuntimeEnvironment, zkWallet: Wallet) {
    this.hre = hre;
    this.zkWallet = zkWallet;
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
  public async loadArtifact(
    contractNameOrFullyQualifiedName: string
  ): Promise<ZkSyncArtifact> {
    const artifact = await this.hre.artifacts.readArtifact(
      contractNameOrFullyQualifiedName
    );

    // Verify that this artifact was compiled by the zkSync compiler, and not `solc` or `vyper`.
    if (artifact._format !== ARTIFACT_FORMAT_VERSION) {
      throw pluginError(
        `Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc`
      );
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
  public async deploy(
    artifact: ZkSyncArtifact,
    _constructorArguments: any[]
  ): Promise<any> {
    const contractBytecode = Uint8Array.from(
      Buffer.from(artifact.bytecode.substr(2), "hex")
    );

    // Load all the dependency bytecodes.
    const dependencies: { [depHash: string]: string } = {};
    for (const dependencyHash in artifact.factoryDeps) {
      const dependencyContract = artifact.factoryDeps[dependencyHash];
      const dependencyBytecode = (await this.hre.artifacts.readArtifact(dependencyContract)).bytecode;
      dependencies[dependencyHash] = dependencyBytecode;
    }

    // TODO 1: SDK will change.
    // TODO 2: We need to pass the constructor arguments.
    // TODO 3: We need to pass the contract CREATE dependencies.
    const sentTx = await this.zkWallet.deployContract({
      bytecode: contractBytecode,
      feeToken: "ETH",
    });

    return sentTx;
  }
}
