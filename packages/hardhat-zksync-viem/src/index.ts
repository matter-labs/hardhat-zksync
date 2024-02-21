import { extendEnvironment } from "hardhat/config";

import "./internal/type-extensions";

import {
  getPublicClient,
} from "./internal/clients";
import "./type-extensions";
import "./internal/tasks";

extendEnvironment((hre) => {
  hre.zkViem = {
    getPublicClient: (publicClientConfig) =>
      getPublicClient(hre.network.provider, publicClientConfig),
  };
});