import type {
  Address,
  GetContractReturnType,
  PublicClientConfig,
  TestClientConfig,
  WalletClientConfig,
} from "viem";
import "hardhat/types/runtime";
import {
  PublicClient,
  WalletClient,
  TestClient,
  getContractAt,
  DeployContractConfig,
} from "./types";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    zksyncViem: {
      getPublicClient(
        publicClientConfig?: Partial<PublicClientConfig>
      ): Promise<PublicClient>;
      getWalletClient(
        address: Address,
        walletClientConfig?: Partial<WalletClientConfig>
      ): Promise<WalletClient>;
      getWalletClients(
        walletClientConfig?: Partial<WalletClientConfig>
      ): Promise<WalletClient[]>;
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
