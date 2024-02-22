import { extendEnvironment } from "hardhat/config";

import "./internal/type-extensions";

import {
  getPublicClient,
} from "./internal/clients";

extendEnvironment((hre) => {
  const { provider } = hre.network;

  // TODO: Lazy object
  hre.zksyncViem = {
    getPublicClient: (publicClientConfig) =>
      getPublicClient(provider, publicClientConfig),
  };
});