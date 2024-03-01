import {
  PublicClient,
  WalletClient,
  TestClient,
  getContractAt,
} from "@nomicfoundation/hardhat-viem/src/types";
import { KeyedClient } from "@nomicfoundation/hardhat-viem/types";
import { Artifact } from "hardhat/types";

export interface FactoryDeps {
  // A mapping from the contract hash to the contract bytecode.
  [contractHash: string]: string;
}

export interface ZkSyncArtifact extends Artifact {
  factoryDeps: FactoryDeps;
  sourceMapping: string;
}

export interface SendTransactionConfig {
  client?: KeyedClient;
  factoryDeps?: string[];
  gasPerPubdata?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  value?: bigint;
}

export interface DeployContractConfig extends SendTransactionConfig {
  confirmations?: number;
}

export { PublicClient, WalletClient, TestClient, getContractAt };
