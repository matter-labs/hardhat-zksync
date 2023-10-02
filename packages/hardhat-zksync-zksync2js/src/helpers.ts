import { Contract, ContractFactory, Provider, Signer, Wallet } from "zksync2-js"

import * as ethers from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Address, DeploymentType } from "zksync2-js/build/src/types";
import { FactoryOptions, ZkSyncArtifact } from "./types";
import { ZkSync2JsPluginError } from "./errors";
import { rich_wallets } from "./rich-wallets";

const ZKSOLC_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
const ZKVYPER_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';

function isArtifact(artifact: any): artifact is ZkSyncArtifact {
  const {
    contractName,
    sourceName,
    abi,
    bytecode,
    deployedBytecode,
    linkReferences,
    deployedLinkReferences,
    factoryDeps
  } = artifact;

  return (
    typeof contractName === "string" &&
    typeof sourceName === "string" &&
    Array.isArray(abi) &&
    typeof bytecode === "string" &&
    typeof deployedBytecode === "string" &&
    linkReferences !== undefined &&
    deployedLinkReferences !== undefined &&
    factoryDeps !== undefined
  );
}

export async function getSigners(
  hre: HardhatRuntimeEnvironment
): Promise<Signer[]> {
  const accounts: string[] = rich_wallets.map((wallet) => wallet.address);

  const signersWithAddress = await Promise.all(
    accounts.map((account) => getSigner(hre, account))
  );

  return signersWithAddress;
}

export async function getSigner(
  hre: HardhatRuntimeEnvironment,
  address: string
): Promise<Signer> {

  return new Signer(hre.zksync2js.provider, address);
}

export async function getImpersonatedSigner(
  hre: HardhatRuntimeEnvironment,
  address: string
): Promise<Signer> {

  await hre.zksync2js.provider.send("hardhat_impersonateAccount", [address]);
  return getSigner(hre, address);
}

export function getContractFactory(
  hre: HardhatRuntimeEnvironment,
  name: string,
  signerOrOptions?: Signer | FactoryOptions,
): Promise<ContractFactory>;


export function getContractFactory(
  hre: HardhatRuntimeEnvironment,
  abi: any[],
  bytecode: ethers.BytesLike,
  signer?: Signer,
  deploymentType?: DeploymentType
): Promise<ContractFactory>;

export async function getContractFactory(
  hre: HardhatRuntimeEnvironment,
  nameOrAbi: string | any[],
  bytecodeOrFactoryOptions?:
    | (Signer | FactoryOptions)
    | ethers.BytesLike,
  signer?: Signer,
  deploymentType?: DeploymentType
): Promise<ContractFactory> {
  if (typeof nameOrAbi === "string") {
    const artifact = await loadArtifact(hre, nameOrAbi);

    return getContractFactoryFromArtifact(
      hre,
      artifact,
      bytecodeOrFactoryOptions as Signer | FactoryOptions | undefined,
      deploymentType
    );
  }

  return getContractFactoryByAbiAndBytecode(
    hre,
    nameOrAbi,
    bytecodeOrFactoryOptions as ethers.BytesLike,
    signer,
    deploymentType
  );
}

function isFactoryOptions(
  signerOrOptions?: Signer | FactoryOptions
): signerOrOptions is FactoryOptions {
  if (signerOrOptions === undefined || "provider" in signerOrOptions) {
    return false;
  }

  return true;
}

export async function getContractFactoryFromArtifact(
  hre: HardhatRuntimeEnvironment,
  artifact: ZkSyncArtifact,
  signerOrOptions?: Signer | FactoryOptions,
  deploymentType?: DeploymentType
): Promise<ContractFactory> {
  let signer: Signer | undefined;

  if (!isArtifact(artifact)) {
    throw new ZkSync2JsPluginError(
      `You are trying to create a contract factory from an artifact, but you have not passed a valid artifact parameter.`
    );
  }

  if (isFactoryOptions(signerOrOptions)) {
    signer = signerOrOptions.signer;
  } else {
    signer = signerOrOptions;
  }

  if (artifact.bytecode === "0x") {
    throw new ZkSync2JsPluginError(
      `You are trying to create a contract factory for the contract ${artifact.contractName}, which is abstract and can't be deployed.
If you want to call a contract using ${artifact.contractName} as its interface use the "getContractAt" function instead.`
    );
  }

  return getContractFactoryByAbiAndBytecode(
    hre,
    artifact.abi,
    artifact.bytecode,
    signer,
    deploymentType
  );
}

async function getContractFactoryByAbiAndBytecode(
  hre: HardhatRuntimeEnvironment,
  abi: any[],
  bytecode: ethers.BytesLike,
  signer?: Signer,
  deploymentType?: DeploymentType
): Promise<ContractFactory> {

  if (signer === undefined) {
    const signers = await hre.zksync2js.getSigners();
    signer = signers[0];
  }

  return new ContractFactory(abi, bytecode, signer, deploymentType);
}

export async function getContractAt(
  hre: HardhatRuntimeEnvironment,
  nameOrAbi: string | any[],
  address: string | Address,
  signer?: Signer
) {
  if (typeof nameOrAbi === "string") {
    const artifact = await loadArtifact(hre, nameOrAbi);

    return getContractAtFromArtifact(hre, artifact, address, signer);
  }

  if (signer === undefined) {
    const signers = await hre.zksync2js.getSigners();
    signer = signers[0];
  }

  // If there's no signer, we want to put the provider for the selected network here.
  // This allows read only operations on the contract interface.
  const signerOrProvider: Signer | Provider =
    signer !== undefined ? signer : hre.zksync2js.provider;


  return new Contract(address, nameOrAbi, signerOrProvider);
}

export async function getContractAtFromArtifact(
  hre: HardhatRuntimeEnvironment,
  artifact: ZkSyncArtifact,
  address: string | Address,
  signer?: Signer
) {
  if (!isArtifact(artifact)) {
    throw new ZkSync2JsPluginError(
      `You are trying to create a contract by artifact, but you have not passed a valid artifact parameter.`
    );
  }

  if (signer === undefined) {
    const signers = await hre.zksync2js.getSigners();
    signer = signers[0];
  }

  let contract = new Contract(address, artifact.abi, signer);

  if (contract.runner === null) {
    contract = contract.connect(hre.zksync2js.provider) as Contract;
  }

  return contract;
}

export async function deployContract(
  hre: HardhatRuntimeEnvironment,
  artifact: ZkSyncArtifact,
  signer?: Signer | Wallet,
  constructorArguments: any[] = [],
  overrides?: ethers.Overrides,
  additionalFactoryDeps?: ethers.BytesLike[],
  deploymentType?: DeploymentType
): Promise<Contract> {

  if(signer === undefined) {
    const signers = await hre.zksync2js.getSigners();
    signer = signers[0];
  }

  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer, deploymentType);

  const baseDeps = await extractFactoryDeps(hre, artifact);
  const additionalDeps = additionalFactoryDeps
      ? additionalFactoryDeps.map((val) => ethers.hexlify(val))
      : [];
  const factoryDeps = [...baseDeps, ...additionalDeps];

  const { customData, ..._overrides } = overrides ?? {};

  // Encode and send the deploy transaction providing factory dependencies.
  const contract = await factory.deploy(...constructorArguments, {
      from: signer.address,
      ..._overrides,
      customData: {
          ...customData,
          factoryDeps,
      },
  });
  
  await contract.deployed();

  return contract;
}


export async function loadArtifact(hre: HardhatRuntimeEnvironment, contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact> {
  const artifact = await hre.artifacts.readArtifact(contractNameOrFullyQualifiedName);

  // Verify that this artifact was compiled by the zkSync compiler, and not `solc` or `vyper`.
  if (
      artifact._format !== ZKSOLC_ARTIFACT_FORMAT_VERSION &&
      artifact._format !== ZKVYPER_ARTIFACT_FORMAT_VERSION
  ) {
      throw new ZkSync2JsPluginError(
          `Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc or zkvyper`
      );
  }
  return artifact as ZkSyncArtifact;
}

export async function extractFactoryDeps(hre: HardhatRuntimeEnvironment, artifact: ZkSyncArtifact): Promise<string[]> {
  const visited = new Set<string>();
  visited.add(`${artifact.sourceName}:${artifact.contractName}`);
  return await extractFactoryDepsRecursive(hre, artifact, visited);
}

async function extractFactoryDepsRecursive(hre: HardhatRuntimeEnvironment, artifact: ZkSyncArtifact, visited: Set<string>): Promise<string[]> {
  // Load all the dependency bytecodes.
  // We transform it into an array of bytecodes.
  const factoryDeps: string[] = [];
  for (const dependencyHash in artifact.factoryDeps) {
      const dependencyContract = artifact.factoryDeps[dependencyHash];
      if (!visited.has(dependencyContract)) {
          const dependencyArtifact = await loadArtifact(hre, dependencyContract);
          factoryDeps.push(dependencyArtifact.bytecode);
          visited.add(dependencyContract);
          const transitiveDeps = await extractFactoryDepsRecursive(hre, dependencyArtifact, visited);
          factoryDeps.push(...transitiveDeps);
      }
  }

  return factoryDeps;
}



