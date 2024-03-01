import { extendEnvironment } from "hardhat/config";

import "./internal/type-extensions";

import { lazyObject } from "hardhat/plugins";
import {
  getPublicClient,
  getWalletClient,
  getWalletClients,
  getTestClient,
} from "./internal/clients";

import { deployContract, getContractAt } from "./internal/contracts";

extendEnvironment((hre) => {
  const { provider } = hre.network;

  hre.zksyncViem = lazyObject(() => ({
    getPublicClient: (publicClientConfig) =>
      getPublicClient(provider, publicClientConfig),
    getWalletClient: (address, walletClientConfig) =>
      getWalletClient(provider, address, walletClientConfig),
    getWalletClients: (walletClientConfig) =>
      getWalletClients(provider, walletClientConfig),
    getTestClient: (testClientConfig) =>
      getTestClient(provider, testClientConfig),
    deployContract: (contractName, constructorArgs, config) =>
      deployContract(hre, contractName, constructorArgs, config),
    getContractAt: (contractName, address, config) =>
      getContractAt(hre, contractName, address, config),
  }));
});
