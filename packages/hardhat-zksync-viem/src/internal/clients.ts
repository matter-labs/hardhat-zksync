import {
  getPublicClient,
  innerGetPublicClient,
  getTestClient,
} from "@nomicfoundation/hardhat-viem/internal/clients";
import { EthereumProvider } from "hardhat/types";
import { Address, Chain, WalletClientConfig } from "viem";
import { Eip712WalletActions, eip712WalletActions } from "viem/zksync";
import { WalletClient } from "./types";

export { getPublicClient, innerGetPublicClient, getTestClient };

export async function getWalletClients(
  provider: EthereumProvider,
  walletClientConfig?: Partial<WalletClientConfig>
): Promise<Array<WalletClient & Eip712WalletActions>> {
  const { getAccounts } = await import("./accounts");
  const { getChain } = await import("./chains");
  const chain = walletClientConfig?.chain ?? (await getChain(provider));
  const accounts = await getAccounts(provider);
  return innerGetWalletClients(provider, chain, accounts, walletClientConfig);
}

export async function getWalletClient(
  provider: EthereumProvider,
  address: Address,
  walletClientConfig?: Partial<WalletClientConfig>
): Promise<WalletClient & Eip712WalletActions> {
  const { getChain } = await import("./chains");
  const chain = walletClientConfig?.chain ?? (await getChain(provider));
  return (
    await innerGetWalletClients(provider, chain, [address], walletClientConfig)
  )[0];
}

export async function innerGetWalletClients(
  provider: EthereumProvider,
  chain: Chain,
  accounts: Address[],
  walletClientConfig?: Partial<WalletClientConfig>
): Promise<Array<WalletClient & Eip712WalletActions>> {
  const viem = await import("viem");
  const { isDevelopmentNetwork } = await import("./chains");
  const defaultParameters = isDevelopmentNetwork(chain.id)
    ? { pollingInterval: 50, cacheTime: 0 }
    : {};
  const parameters = { ...defaultParameters, ...walletClientConfig };

  const walletClients = accounts.map((account) => {
    const walletClient = viem.createWalletClient({
      chain,
      account,
      transport: viem.custom(provider),
      ...parameters,
    });
    return walletClient.extend(eip712WalletActions());
  });

  return walletClients;
}
