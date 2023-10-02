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

export class ZkSyncContractFactory extends ContractFactory {
  // The factory dependencies of the contract.
  factoryDeps: FactoryDeps;
  constructor(abi: ethers.Interface | ethers.InterfaceAbi, bytecode: ethers.BytesLike, runner?: ethers.ContractRunner, deploymentType?: DeploymentType, factoryDeps?: FactoryDeps) {
    super(abi, bytecode, runner, deploymentType);
    this.factoryDeps = factoryDeps ?? {};
  }
}

export interface FactoryOptions {
  signer?: Signer;
}

export type DeployContractOptions = FactoryOptions & ethers.Overrides;

export declare function getContractFactory(
  name: string,
  signerOrOptions?: Signer | FactoryOptions,
  deploymentType?: DeploymentType
): Promise<ContractFactory>;

export declare function getContractFactory(
  abi: any[],
  bytecode: ethers.BytesLike,
  signer?: Signer,
  deploymentType?: DeploymentType
): Promise<ContractFactory>;

export declare function deployContract(
  contractFactoryOrArtifact: ContractFactory | ZkSyncArtifact,
  constructorArguments: any[],
  overrides?: ethers.Overrides,
  additionalFactoryDeps?: ethers.BytesLike[],
): Promise<Contract>;

export declare function getContractFactoryFromArtifact(
  artifact: ZkSyncArtifact,
  signerOrOptions?: Signer | FactoryOptions,
  deploymentType?: DeploymentType
): Promise<ContractFactory>;

export interface HardhatZksync2jsHelpers {
  provider: Provider;

  getContractFactory: typeof getContractFactory;
  getContractFactoryFromArtifact: typeof getContractFactoryFromArtifact;
  getContractAt: (
    nameOrAbi: string | any[],
    address: string | Address,
    signer?: Signer
  ) => Promise<Contract>;
  getContractAtFromArtifact: (
    artifact: ZkSyncArtifact,
    address: string,
    signer?: Signer
  ) => Promise<Contract>;
  getSigner: (address: string) => Promise<Signer>;
  getSigners: () => Promise<Signer[]>;
  getImpersonatedSigner: (address: string) => Promise<Signer>;
  extractFactoryDeps: (artifact: ZkSyncArtifact) => Promise<string[]>;
  loadArtifact: (name: string) => Promise<ZkSyncArtifact>;
  deployContract: (artifact: ZkSyncArtifact,
    constructorArguments: any[],
    signer?: Signer | Wallet,
    overrides?: ethers.Overrides,
    additionalFactoryDeps?: ethers.BytesLike[]) => Promise<Contract>;
}
