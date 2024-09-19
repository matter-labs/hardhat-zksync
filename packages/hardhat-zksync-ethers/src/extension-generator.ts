import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address, DeploymentType } from 'zksync-ethers/build/types';
import { lazyObject } from 'hardhat/plugins';
import { Overrides, BytesLike } from 'ethers';
import { createProviders } from './utils';
import {
    deployContract,
    extractFactoryDeps,
    getContractAtFromArtifact,
    getContractFactoryFromArtifact,
    getImpersonatedSigner,
    getSigner,
    getSigners,
    getWallet,
    getWallets,
    loadArtifact,
    makeContractAt,
    makeGetContractFactory,
} from './helpers';
import { HardhatZksyncSignerOrWallet, HardhatZksyncSignerOrWalletOrFactoryOptions, ZkSyncArtifact } from './types';
import { Generator } from './generator';

export class ZkSyncGenerator implements Generator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populateExtension(): any {
        return lazyObject(() => {
            const zksyncEthers = require('zksync-ethers');
            const { ethWeb3Provider, zkWeb3Provider } = createProviders(this._hre);
            const { ethers } = require('ethers');

            return {
                ...ethers,
                ...zksyncEthers,
                providerL1: ethWeb3Provider,
                providerL2: zkWeb3Provider,
                provider: zkWeb3Provider,
                getSigners: () => getSigners(this._hre),
                getSigner: (address: string) => getSigner(this._hre, address),
                getWallet: (privateKeyOrIndex?: string | number) => getWallet(this._hre, privateKeyOrIndex),
                getWallets: () => getWallets(this._hre),
                getImpersonatedSigner: (address: string) => getImpersonatedSigner(this._hre, address),
                getContractFactory: makeGetContractFactory(this._hre),
                getContractFactoryFromArtifact: (
                    artifact: ZkSyncArtifact,
                    walletOrSignerOrOptions?: HardhatZksyncSignerOrWalletOrFactoryOptions,
                    deploymentType?: DeploymentType,
                ) => getContractFactoryFromArtifact(this._hre, artifact, walletOrSignerOrOptions, deploymentType),
                getContractAt: makeContractAt(this._hre),
                getContractAtFromArtifact: (
                    artifact: ZkSyncArtifact,
                    address: string | Address,
                    walletOrSigner?: HardhatZksyncSignerOrWallet,
                ) => getContractAtFromArtifact(this._hre, artifact, address, walletOrSigner),
                extractFactoryDeps: (artifact: ZkSyncArtifact) => extractFactoryDeps(this._hre, artifact),
                loadArtifact: (name: string) => loadArtifact(this._hre, name),
                deployContract: (
                    artifact: ZkSyncArtifact,
                    constructorArguments: any[],
                    walletOrSigner?: HardhatZksyncSignerOrWallet,
                    overrides?: Overrides,
                    additionalFactoryDeps?: BytesLike[],
                ) =>
                    deployContract(
                        this._hre,
                        artifact,
                        constructorArguments,
                        walletOrSigner,
                        overrides,
                        additionalFactoryDeps,
                    ),
            };
        });
    }
}
