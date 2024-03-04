import { getContractAt } from "@nomicfoundation/hardhat-viem/internal/contracts";
import type {
  EthereumProvider,
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import {
  type Abi,
  type Address,
  type Hex,
  Hash,
  Account,
} from "viem";
import type { PublicClient } from "@nomicfoundation/hardhat-viem/types";
import { Eip712WalletActions } from "viem/zksync";
import { getPublicClient, getWalletClients } from "./clients";
import {
  DefaultWalletClientNotFoundError,
  DeployContractError,
  HardhatZksyncViemError,
  InvalidConfirmationsError,
} from "./errors";

import { isZksyncNetwork } from "./chains";
import { gasPerPubdata, gasPrice } from "./constants";
import {
  extractDeployedAddress,
  extractFactoryDeps,
  loadArtifact,
} from "./utils";
import { DeployContractConfig, WalletClient } from "./types";

import { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";

export async function deployContract(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  constructorArgs: any[] = [],
  config: DeployContractConfig = {}
): Promise<GetContractReturnType> {
  const { network } = hre;
  const { client, confirmations, ...deployContractParameters } = config;
  const [publicClient, walletClient] = await Promise.all([
    client?.public ?? getPublicClient(network.provider),
    client?.wallet ?? getDefaultWalletClient(network.provider, network.name),
  ]);

  const artifact = await loadArtifact(hre, contractName);
  const factoryDeps = await extractFactoryDeps(hre, artifact);

  return innerDeployContract(
    publicClient,
    walletClient.account,
    walletClient,
    artifact.abi,
    artifact.bytecode as Hex,
    constructorArgs,
    factoryDeps,
    deployContractParameters,
    confirmations
  );
}

export async function innerDeployContract(
  publicClient: PublicClient,
  account: Account,
  eip712walletClientActions: WalletClient & Eip712WalletActions,
  contractAbi: Abi,
  contractBytecode: Hex,
  constructorArgs: any[],
  factoryDeps: any[],
  _deployContractParameters: DeployContractConfig = {},
  confirmations: number = 1
): Promise<GetContractReturnType> {
  if (!isZksyncNetwork(publicClient.chain.id)) {
    throw new HardhatZksyncViemError(
      `Public client is not connected to zkSync chain. Current chain: ${publicClient.chain.name}`
    );
  }

  const deploymentTxHash: Hash = await eip712walletClientActions.deployContract(
    {
      account,
      abi: contractAbi,
      args: constructorArgs,
      bytecode: contractBytecode,
      factoryDeps,
      gasPerPubdata,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: gasPrice,
    }
  );

  if (confirmations < 0) {
    throw new HardhatZksyncViemError("Confirmations must be greater than 0.");
  }
  if (confirmations === 0) {
    throw new InvalidConfirmationsError();
  }

  await publicClient.waitForTransactionReceipt({
    hash: deploymentTxHash,
  });
  const receipt = await publicClient.getTransactionReceipt({
    hash: deploymentTxHash,
  });

  const contractAddress = extractDeployedAddress(receipt);

  if (contractAddress === null) {
    const transaction = await publicClient.getTransaction({
      hash: deploymentTxHash,
    });
    throw new DeployContractError(deploymentTxHash, transaction.blockNumber);
  }

  const contract = await innerGetContractAt(
    publicClient,
    eip712walletClientActions,
    contractAbi,
    contractAddress
  );

  return contract;
}

async function innerGetContractAt(
  publicClient: PublicClient,
  walletClient: WalletClient,
  contractAbi: Abi,
  address: Address
): Promise<GetContractReturnType> {
  const viem = await import("viem");
  const contract = viem.getContract({
    address,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
    abi: contractAbi,
  });

  return contract;
}

async function getDefaultWalletClient(
  provider: EthereumProvider,
  networkName: string
): Promise<WalletClient & Eip712WalletActions> {
  const [defaultWalletClient] = await getWalletClients(provider);

  if (defaultWalletClient === undefined) {
    throw new DefaultWalletClientNotFoundError(networkName);
  }

  return defaultWalletClient;
}

export { getContractAt };
