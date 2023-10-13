import { Provider, Signer, Wallet } from "zksync2-js"

import { extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import './type-extensions';

import {
  extractFactoryDeps,
    getContractAt,
    getContractAtFromArtifact,
    getContractFactory,
    getContractFactoryFromArtifact,
    getImpersonatedSigner,
    getSigner,
    getSigners,
    loadArtifact,
    deployContract
  } from "./helpers";
import { ZkSyncArtifact } from "./types";
import { ethers } from "ethers";

  
  extendEnvironment((hre) => {
    hre.zksync2js = lazyObject(() => {
      const { zksync2js } = require("zksync2-js");
      const config: any = hre.network.config;
      const provider: Provider = new Provider(config.url);
  
      return {
        ...zksync2js,
        provider,
        getSigner: (address: string) => getSigner(hre, address),
        getSigners: () => getSigners(hre),
        getImpersonatedSigner: (address: string) => getImpersonatedSigner(hre, address),
        getContractFactory: getContractFactory.bind(null, hre) as any,
        getContractFactoryFromArtifact: (...args) => getContractFactoryFromArtifact(hre, ...args),
        getContractAt: (...args) => getContractAt(hre, ...args),
        getContractAtFromArtifact: (...args) => getContractAtFromArtifact(hre, ...args),
        extractFactoryDeps: (artifact: ZkSyncArtifact) => extractFactoryDeps(hre, artifact),
        loadArtifact: (name: string) => loadArtifact(hre, name),
        deployContract: (artifact: ZkSyncArtifact,
          constructorArguments: any[],
          signer?: Signer | Wallet,
          overrides?: ethers.Overrides,
          additionalFactoryDeps?: ethers.BytesLike[]) => 
          deployContract(hre, artifact, signer, constructorArguments = [], overrides, additionalFactoryDeps)
      };
    });
  });
  