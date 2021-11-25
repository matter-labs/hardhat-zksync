import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as zk from "zksync-web3";
import * as ethers from "ethers";

import { ZkSyncArtifact } from "./types";
import { pluginError } from "./helpers";

const ARTIFACT_FORMAT_VERSION = "hh-zksolc-artifact-1";
const SUPPORTED_L1_TESTNETS = ["mainnet", "rinkeby", "ropsten", "kovan"];

/**
 * An entity capable of deploying contracts to the zkSync network.
 */
export class Deployer {
  public hre: HardhatRuntimeEnvironment;
  public ethWallet: ethers.Wallet;
  public zkWallet: zk.Wallet;

  constructor(hre: HardhatRuntimeEnvironment, ethWallet: ethers.Wallet) {
    this.hre = hre;

    // Initalize two providers: one for the Ethereum RPC (layer 1), and one for the zkSync RPC (layer 2). We will need both.
    const ethNetwork = hre.config.zkSyncDeploy.ethNetwork;
    const ethWeb3Provider = SUPPORTED_L1_TESTNETS.includes(ethNetwork)
      ? ethers.getDefaultProvider(ethNetwork)
      : new ethers.providers.JsonRpcProvider(ethNetwork);
    const zkWeb3Provider = new zk.Provider(hre.config.zkSyncDeploy.zkSyncNetwork);

    // Create a zkSync wallet using the Ethereum wallet created above.
    const zkWallet = new zk.Wallet(ethWallet.privateKey, zkWeb3Provider, ethWeb3Provider);

    this.ethWallet = ethWallet;
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
   * @returns A contract object.
   */
  public async deploy(
    artifact: ZkSyncArtifact,
    constructorArguments: any[]
  ): Promise<zk.Contract> {
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

    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, this.zkWallet);
    const contract = await factory.deploy(
      ...constructorArguments,
      { feeToken: zk.utils.ETH_ADDRESS }
    );
    await contract.deployed();

    return contract;
  }
}
