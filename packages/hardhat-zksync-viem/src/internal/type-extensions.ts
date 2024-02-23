
import type {Address, PublicClient, PublicClientConfig, TestClientConfig, WalletClient, WalletClientConfig} from "viem";
import "hardhat/types/runtime";
import { TestClient } from "./types";

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
    }
  }
}