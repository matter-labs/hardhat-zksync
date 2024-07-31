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
    if (hre.network.config.zksync) {
        hre.ethers = lazyObject(() => {
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
    } else {
        hre.ethers = lazyObject(() => {
            const hardhatEthersHelpers = require('@nomicfoundation/hardhat-ethers/internal/helpers');
            const {
                HardhatEthersProvider,
            } = require('@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider');

            const provider = new HardhatEthersProvider(hre.network.provider, hre.network.name);

            return {
                ...ethers,
                provider,

                getSigner: (address: string) => hardhatEthersHelpers.getSigner(hre, address),
                getSigners: () => hardhatEthersHelpers.getSigners(hre),
                getImpersonatedSigner: (address: string) => hardhatEthersHelpers.getImpersonatedSigner(hre, address),
                getContractFactory: hardhatEthersHelpers.getContractFactory.bind(null, hre) as any,
                getContractFactoryFromArtifact: (...args) =>
                    hardhatEthersHelpers.getContractFactoryFromArtifact(hre, args),
                getContractAt: (...args) => hardhatEthersHelpers.getContractAt(hre, args),
                deployContract: hardhatEthersHelpers.deployContract.bind(null, hre) as any,
            } as any;
        });
    }
});
