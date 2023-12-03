import { Provider, Wallet } from 'zksync2-js';

import { extendConfig, extendEnvironment } from 'hardhat/config';
import { lazyObject } from 'hardhat/plugins';
import './type-extensions';

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
import { ethers } from 'ethers';
import { Address, DeploymentType } from 'zksync2-js/build/src/types';
import { zksyncNetworks } from './networks';

extendConfig((config, userConfig) => {
    if (!userConfig.networks?.zkSyncTestnet) {
        config.networks.zkSyncTestnet = zksyncNetworks.zkSyncTestnet;
    }

    if (!userConfig.networks?.zkSyncMainnet) {
        config.networks.zkSyncMainnet = zksyncNetworks.zkSyncMainnet;
    }

    if (!userConfig.networks?.zkSyncDockerizedNode) {
        config.networks.zkSyncDockerizedNode = zksyncNetworks.zkSyncDockerizedNode;
    }

    if (!userConfig.networks?.zkSyncInMemoryNode) {
        config.networks.zkSyncInMemoryNode = zksyncNetworks.zkSyncInMemoryNode;
    }
});

extendEnvironment((hre) => {
    hre.zksync2js = lazyObject(() => {
        const { zksync2js } = require('zksync2-js');
        const config: any = hre.network.config;
        const provider: Provider = new Provider(config.url);

        return {
            ...zksync2js,
            provider,
            getWallet: (privateKeyOrIndex?: string | number) => getWallet(hre, privateKeyOrIndex),
            getWallets: () => getWallets(hre),
            getImpersonatedSigner: (address: string) => getImpersonatedSigner(hre, address),
            getContractFactory: getContractFactory.bind(null, hre) as any,
            getContractFactoryFromArtifact: (
                artifact: ZkSyncArtifact,
                walletOrOptions?: Wallet | FactoryOptions,
                deploymentType?: DeploymentType) => getContractFactoryFromArtifact(hre, artifact, walletOrOptions, deploymentType),
            getContractAt: (nameOrAbi: string | any[], address: string | Address, wallet?: Wallet) => getContractAt(hre, nameOrAbi, address, wallet),
            getContractAtFromArtifact: (artifact: ZkSyncArtifact, address: string | Address, wallet?: Wallet) => getContractAtFromArtifact(hre, artifact, address, wallet),
            extractFactoryDeps: (artifact: ZkSyncArtifact) => extractFactoryDeps(hre, artifact),
            loadArtifact: (name: string) => loadArtifact(hre, name),
            deployContract: (
                artifact: ZkSyncArtifact,
                constructorArguments: any[],
                wallet?: Wallet,
                overrides?: ethers.Overrides,
                additionalFactoryDeps?: ethers.BytesLike[]
            ) => deployContract(hre, artifact, wallet, (constructorArguments = []), overrides, additionalFactoryDeps),
        };
    });
});
