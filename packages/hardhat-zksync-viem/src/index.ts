import { extendEnvironment } from "hardhat/config";

import "./internal/type-extensions";

import {
  getPublicClient,
  getWalletClient,
  getWalletClients
} from "./internal/clients";

extendEnvironment((hre) => {
  const { provider } = hre.network;

  // TODO: Lazy object
  hre.zksyncViem = {
    getPublicClient: (publicClientConfig) =>
      getPublicClient(provider, publicClientConfig),
    getWalletClient: (address, walletClientConfig) =>
      getWalletClient(provider, address, walletClientConfig),
    getWalletClients: (walletClientConfig) =>
      getWalletClients(hre.network.provider, walletClientConfig),
  };
});