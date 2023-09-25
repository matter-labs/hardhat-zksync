import type * as ethers from "ethers";
import type { Artifact } from "hardhat/types";
import { ContractFactory, Provider, Signer } from "zksync-web3";
import { Address } from "zksync-web3/build/src/types";

export interface FactoryOptions {
  signer?: Signer;
}

export type DeployContractOptions = FactoryOptions & ethers.Overrides;

export declare function getContractFactory(
  name: string,
  signerOrOptions?: Signer | FactoryOptions
): Promise<ContractFactory>;
export declare function getContractFactory(
  abi: any[],
  bytecode: ethers.BytesLike,
  signer?: Signer
): Promise<ContractFactory>;

export declare function deployContract(
  name: string,
  signerOrOptions?: Signer | DeployContractOptions
): Promise<ethers.Contract>;

export declare function deployContract(
  name: string,
  args: any[],
  signerOrOptions?: Signer | DeployContractOptions
): Promise<ethers.Contract>;

export declare function getContractFactoryFromArtifact(
  artifact: Artifact,
  signerOrOptions?: Signer | FactoryOptions
): Promise<ContractFactory>;

export interface HardhatZkSyncWeb3Helpers {
  provider: Provider;

  getContractFactory: typeof getContractFactory;
  getContractFactoryFromArtifact: typeof getContractFactoryFromArtifact;
  getContractAt: (
    nameOrAbi: string | any[],
    address: string | Address,
    signer?: Signer
  ) => Promise<ethers.Contract>;
  getContractAtFromArtifact: (
    artifact: Artifact,
    address: string,
    signer?: Signer
  ) => Promise<ethers.Contract>;
  getSigner: (address: string) => Promise<Signer>;
  getSigners: () => Promise<Signer[]>;
  getImpersonatedSigner: (address: string) => Promise<Signer>;
  deployContract: typeof deployContract;
}
