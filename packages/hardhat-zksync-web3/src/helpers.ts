import {Contract, ContractFactory, Provider, Signer} from "zksync-web3"

import  * as ethers from "ethers";

import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

import { Address } from "zksync-web3/build/src/types";
import { DeployContractOptions, FactoryOptions } from "./types";
import { ZkSyncWeb3PluginError } from "./errors";

function isArtifact(artifact: any): artifact is Artifact {
  const {
    contractName,
    sourceName,
    abi,
    bytecode,
    deployedBytecode,
    linkReferences,
    deployedLinkReferences,
  } = artifact;

  return (
    typeof contractName === "string" &&
    typeof sourceName === "string" &&
    Array.isArray(abi) &&
    typeof bytecode === "string" &&
    typeof deployedBytecode === "string" &&
    linkReferences !== undefined &&
    deployedLinkReferences !== undefined
  );
}

export async function getSigners(
  hre: HardhatRuntimeEnvironment
): Promise<Signer[]> {
  const accounts: string[] = await hre.zkSyncWeb3.provider.send("eth_accounts", []);

  const signersWithAddress = await Promise.all(
    accounts.map((account) => getSigner(hre, account))
  );

  return signersWithAddress;
}

export async function getSigner(
  hre: HardhatRuntimeEnvironment,
  address: string
): Promise<Signer> {
  // const { Signer: SignerWithAddressImpl } = await import(
  //   "../signers"
  // );

  // const signerWithAddress = await SignerWithAddressImpl.create(
  //   hre.zkSyncWeb3.provider,
  //   address
  // );

  // return signerWithAddress;

  const signers = await hre.zkSyncWeb3.getSigners();
  return signers[0];
}

export async function getImpersonatedSigner(
  hre: HardhatRuntimeEnvironment,
  address: string
): Promise<Signer> {
  await hre.zkSyncWeb3.provider.send("hardhat_impersonateAccount", [address]);
  return getSigner(hre, address);
}

export function getContractFactory(
  hre: HardhatRuntimeEnvironment,
  name: string,
  signerOrOptions?: Signer | FactoryOptions
): Promise<ContractFactory>;


export function getContractFactory(
  hre: HardhatRuntimeEnvironment,
  abi: any[],
  bytecode: ethers.BytesLike,
  signer?: Signer
): Promise<ContractFactory>;

export async function getContractFactory(
  hre: HardhatRuntimeEnvironment,
  nameOrAbi: string | any[],
  bytecodeOrFactoryOptions?:
    | (Signer | FactoryOptions)
    | ethers.BytesLike,
  signer?: Signer
): Promise<ContractFactory> {
  if (typeof nameOrAbi === "string") {
    const artifact = await hre.artifacts.readArtifact(nameOrAbi);

    return getContractFactoryFromArtifact(
      hre,
      artifact,
      bytecodeOrFactoryOptions as Signer | FactoryOptions | undefined
    );
  }

  return getContractFactoryByAbiAndBytecode(
    hre,
    nameOrAbi,
    bytecodeOrFactoryOptions as ethers.BytesLike,
    signer
  );
}

function isFactoryOptions(
  signerOrOptions?: Signer | FactoryOptions
): signerOrOptions is FactoryOptions {
  return !signerOrOptions || "provider" in signerOrOptions;
}

export async function getContractFactoryFromArtifact(
  hre: HardhatRuntimeEnvironment,
  artifact: Artifact,
  signerOrOptions?: Signer | FactoryOptions
): Promise<ContractFactory> {
  let signer: Signer | undefined;

  if (!isArtifact(artifact)) {
    throw new ZkSyncWeb3PluginError(
      `You are trying to create a contract factory from an artifact, but you have not passed a valid artifact parameter.`
    );
  }

  if (isFactoryOptions(signerOrOptions)) {
    signer = signerOrOptions.signer;
  } else {
    signer = signerOrOptions;
  }

  if (artifact.bytecode === "0x") {
    throw new ZkSyncWeb3PluginError(
      `You are trying to create a contract factory for the contract ${artifact.contractName}, which is abstract and can't be deployed.
If you want to call a contract using ${artifact.contractName} as its interface use the "getContractAt" function instead.`
    );
  }

  return getContractFactoryByAbiAndBytecode(
    hre,
    artifact.abi,
    artifact.bytecode,
    signer
  );
}

async function getContractFactoryByAbiAndBytecode(
  hre: HardhatRuntimeEnvironment,
  abi: any[],
  bytecode: ethers.BytesLike,
  signer?: Signer
): Promise<ContractFactory> {

  if (signer === undefined) {
    const signers = await hre.zkSyncWeb3.getSigners();
    signer = signers[0];
  }

  return new ContractFactory(abi, bytecode, signer);
}

export async function getContractAt(
  hre: HardhatRuntimeEnvironment,
  nameOrAbi: string | any[],
  address: string | Address,
  signer?: Signer
) {
  if (typeof nameOrAbi === "string") {
    const artifact = await hre.artifacts.readArtifact(nameOrAbi);

    return getContractAtFromArtifact(hre, artifact, address, signer);
  }

  if (signer === undefined) {
    const signers = await hre.zkSyncWeb3.getSigners();
    signer = signers[0];
  }

  // If there's no signer, we want to put the provider for the selected network here.
  // This allows read only operations on the contract interface.
  const signerOrProvider: Signer | Provider =
    signer !== undefined ? signer : hre.zkSyncWeb3.provider;


  return new Contract(address, nameOrAbi, signerOrProvider);
}

export async function deployContract(
  hre: HardhatRuntimeEnvironment,
  name: string,
  args?: any[],
  signerOrOptions?: Signer | DeployContractOptions
): Promise<Contract>;

export async function deployContract(
  hre: HardhatRuntimeEnvironment,
  name: string,
  signerOrOptions?: Signer | DeployContractOptions
): Promise<Contract>;

export async function deployContract(
  hre: HardhatRuntimeEnvironment,
  name: string,
  argsOrSignerOrOptions?: any[] | Signer | DeployContractOptions,
  signerOrOptions?: Signer | DeployContractOptions
): Promise<Contract> {
  let args = [];
  if (Array.isArray(argsOrSignerOrOptions)) {
    args = argsOrSignerOrOptions;
  } else {
    signerOrOptions = argsOrSignerOrOptions;
  }

  let overrides: ethers.Overrides = {};
  if (signerOrOptions !== undefined && !("getAddress" in signerOrOptions)) {
    const overridesAndFactoryOptions = { ...signerOrOptions };

    // we delete the factory options properties in case ethers
    // rejects unknown properties
    delete overridesAndFactoryOptions.signer;

    overrides = overridesAndFactoryOptions;
  }

  const factory = await getContractFactory(hre, name, signerOrOptions);
  return factory.deploy(...args, overrides);
}

export async function getContractAtFromArtifact(
  hre: HardhatRuntimeEnvironment,
  artifact: Artifact,
  address: string | Address,
  signer?: Signer
) {
  if (!isArtifact(artifact)) {
    throw new ZkSyncWeb3PluginError(
      `You are trying to create a contract by artifact, but you have not passed a valid artifact parameter.`
    );
  }

  if (signer === undefined) {
    const signers = await hre.zkSyncWeb3.getSigners();
    signer = signers[0];
  }

  let contract = new Contract(address, artifact.abi, signer);

  if (contract.runner === null) {
    contract = contract.connect(hre.zkSyncWeb3.provider) as Contract;
  }

  return contract;
}
