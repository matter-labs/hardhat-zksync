import { Wallet } from 'zksync-ethers';

import { extendEnvironment } from 'hardhat/config';
import { lazyObject } from 'hardhat/plugins';
import './type-extensions';

import { ethers } from 'ethers';
import { Address, DeploymentType } from 'zksync-ethers/build/types';
import {
    extractFactoryDeps,
    getContractAt,
    getContractAtFromArtifact,
    getContractFactory,
    getContractFactoryFromArtifact,
    getImpersonatedSigner,
    getWallet,
    getWallets,
    loadArtifact,
    deployContract,
} from './helpers';
import { FactoryOptions, ZkSyncArtifact } from './types';
import { createProviders } from './utils';

extendEnvironment((hre) => {
    hre.zksyncEthers = lazyObject(() => {
        const { zksyncEthers } = require('zksync-ethers');
        const { ethWeb3Provider, zkWeb3Provider } = createProviders(hre.config.networks, hre.network);
        return {
            ...zksyncEthers,
            providerL1: ethWeb3Provider,
            providerL2: zkWeb3Provider,
            getWallet: (privateKeyOrIndex?: string | number) => getWallet(hre, privateKeyOrIndex),
            getWallets: () => getWallets(hre),
            getImpersonatedSigner: (address: string) => getImpersonatedSigner(hre, address),
            getContractFactory: getContractFactory.bind(null, hre) as any,
            getContractFactoryFromArtifact: (
                artifact: ZkSyncArtifact,
                walletOrOptions?: Wallet | FactoryOptions,
                deploymentType?: DeploymentType,
            ) => getContractFactoryFromArtifact(hre, artifact, walletOrOptions, deploymentType),
            getContractAt: (nameOrAbi: string | any[], address: string | Address, wallet?: Wallet) =>
                getContractAt(hre, nameOrAbi, address, wallet),
            getContractAtFromArtifact: (artifact: ZkSyncArtifact, address: string | Address, wallet?: Wallet) =>
                getContractAtFromArtifact(hre, artifact, address, wallet),
            extractFactoryDeps: (artifact: ZkSyncArtifact) => extractFactoryDeps(hre, artifact),
            loadArtifact: (name: string) => loadArtifact(hre, name),
            deployContract: (
                artifact: ZkSyncArtifact,
                constructorArguments: any[],
                wallet?: Wallet,
                overrides?: ethers.Overrides,
                additionalFactoryDeps?: ethers.BytesLike[],
            ) => deployContract(hre, artifact, constructorArguments, wallet, overrides, additionalFactoryDeps),
        };
    });
});
