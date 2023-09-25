
import { Provider } from "zksync-web3"

import { extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";


import {
    getContractAt,
    getContractAtFromArtifact,
    getContractFactory,
    getContractFactoryFromArtifact,
    getImpersonatedSigner,
    getSigner,
    getSigners,
    deployContract,
  } from "./helpers";

  
  extendEnvironment((hre) => {
    hre.zkSyncWeb3 = lazyObject(() => {
      const { zkSyncWeb3 } = require("zksync-web3");
      const config: any = hre.network.config;
      const provider: Provider = new Provider(config.url)
  
      return {
        ...zkSyncWeb3,
  
        provider,
  
        getSigner: (address: string) => getSigner(hre, address),
        getSigners: () => getSigners(hre),
        getImpersonatedSigner: (address: string) =>
          getImpersonatedSigner(hre, address),
        // We cast to any here as we hit a limitation of Function#bind and
        // overloads. See: https://github.com/microsoft/TypeScript/issues/28582
        getContractFactory: getContractFactory.bind(null, hre) as any,
        getContractFactoryFromArtifact: (...args) =>
          getContractFactoryFromArtifact(hre, ...args),
        getContractAt: (...args) => getContractAt(hre, ...args),
        
        getContractAtFromArtifact: (...args) =>
          getContractAtFromArtifact(hre, ...args),
        deployContract: deployContract.bind(null, hre) as any,
      };
    });
  });
  