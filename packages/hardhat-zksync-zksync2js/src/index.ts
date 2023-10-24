import { Provider, Wallet } from 'zksync2-js';

import { extendEnvironment } from 'hardhat/config';
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
import { ZkSyncArtifact } from './types';
import { ethers } from 'ethers';

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
            getContractFactoryFromArtifact: (...args) => getContractFactoryFromArtifact(hre, ...args),
            getContractAt: (...args) => getContractAt(hre, ...args),
            getContractAtFromArtifact: (...args) => getContractAtFromArtifact(hre, ...args),
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
