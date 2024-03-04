import type {
  Address,
  PublicClientConfig,
  TestClientConfig,
  WalletClientConfig,
} from "viem";
import {
  PublicClient,
  WalletClient,
  TestClient,
  getContractAt,
  DeployContractConfig,
} from "./types";
import { Eip712WalletActions } from "viem/zksync";

import { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";


declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    zksyncViem: {
      getPublicClient(
        publicClientConfig?: Partial<PublicClientConfig>
      ): Promise<PublicClient>;
      getWalletClient(
        address: Address,
        walletClientConfig?: Partial<WalletClientConfig>
      ): Promise<WalletClient & Eip712WalletActions>;
      getWalletClients(
        walletClientConfig?: Partial<WalletClientConfig>
      ): Promise<(WalletClient & Eip712WalletActions)[]>;
      getTestClient(
        testClientConfig?: Partial<TestClientConfig>
      ): Promise<TestClient>;
      deployContract(
        contractName: string,
        constructorArgs: any[],
        config: DeployContractConfig
      ): Promise<GetContractReturnType>;
      getContractAt: typeof getContractAt;
    };
  }
}
