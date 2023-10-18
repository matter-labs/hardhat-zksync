import type * as ethers from "ethers";
import type { Artifact } from "hardhat/types";
import { Contract, ContractFactory, Provider, Signer, Wallet } from "zksync2-js";
import { Address, DeploymentType } from "zksync2-js/build/src/types";


export interface FactoryDeps {
  // A mapping from the contract hash to the contract bytecode.
  [contractHash: string]: string;
}

export interface ZkSyncArtifact extends Artifact {
  // List of factory dependencies of a contract.
  factoryDeps: FactoryDeps;
  // Mapping from the bytecode to the zkEVM assembly (used for tracing).
  sourceMapping: string;
}

export interface FactoryOptions {
  wallet?: Wallet;
}

export declare function getContractFactory(
  name: string,
  wallet?: Wallet,
  deploymentType?: DeploymentType
): Promise<ContractFactory>;

export declare function getContractFactory(
  abi: any[],
  bytecode: ethers.BytesLike,
  wallet?: Wallet,
  deploymentType?: DeploymentType
): Promise<ContractFactory>;

export declare function deployContract(
  contractFactoryOrArtifact: ContractFactory | ZkSyncArtifact,
  constructorArguments: any[],
  wallet?: Wallet,
  overrides?: ethers.Overrides,
  additionalFactoryDeps?: ethers.BytesLike[],
): Promise<Contract>;

export declare function getContractFactoryFromArtifact(
  artifact: ZkSyncArtifact,
  wallet?: Wallet,
  deploymentType?: DeploymentType
): Promise<ContractFactory>;

export interface HardhatZksync2jsHelpers {
  provider: Provider;

  getWallet: (privateKey?: string) => Wallet;
  getContractFactory: typeof getContractFactory;
  getContractFactoryFromArtifact: typeof getContractFactoryFromArtifact;
  getContractAt: (
    nameOrAbi: string | any[],
    address: string | Address,
    wallet?: Wallet
  ) => Promise<Contract>;
  getContractAtFromArtifact: (
    artifact: ZkSyncArtifact,
    address: string,
    wallet?: Wallet
  ) => Promise<Contract>;
  getSigner: (address: string) => Signer;
  getSigners: () => Signer[];
  getImpersonatedSigner: (address: string) => Promise<Signer>;
  extractFactoryDeps: (artifact: ZkSyncArtifact) => Promise<string[]>;
  loadArtifact: (name: string) => Promise<ZkSyncArtifact>;
  deployContract: (artifact: ZkSyncArtifact,
    constructorArguments: any[],
    wallet?: Wallet,
    overrides?: ethers.Overrides,
    additionalFactoryDeps?: ethers.BytesLike[]) => Promise<Contract>;
}
