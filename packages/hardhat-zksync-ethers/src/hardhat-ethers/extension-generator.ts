import { FactoryOptions } from '@nomicfoundation/hardhat-ethers/types';
import { Addressable, Signer } from 'ethers';
import { lazyObject } from 'hardhat/plugins';
import { Artifact, HardhatRuntimeEnvironment } from 'hardhat/types';
import { Generator } from '../generator';

export class EthersGenerator implements Generator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populateExtension(): any {
        return lazyObject(() => {
            const hardhatEthersHelpers = require('@nomicfoundation/hardhat-ethers/internal/helpers');
            const {
                HardhatEthersProvider,
            } = require('@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider');
            const { ethers } = require('ethers');
            const provider = new HardhatEthersProvider(this._hre.network.provider, this._hre.network.name);
            return {
                ...ethers,
                provider,
                getSigner: (address: string) => hardhatEthersHelpers.getSigner(this._hre, address),
                getSigners: () => hardhatEthersHelpers.getSigners(this._hre),
                getImpersonatedSigner: (address: string) =>
                    hardhatEthersHelpers.getImpersonatedSigner(this._hre, address),
                getContractFactory: hardhatEthersHelpers.getContractFactory.bind(null, this._hre) as any,
                getContractFactoryFromArtifact: (artifact: Artifact, signerOrOptions?: Signer | FactoryOptions) =>
                    hardhatEthersHelpers.getContractFactoryFromArtifact(this._hre, artifact, signerOrOptions),
                getContractAt: (nameOrAbi: string | any[], address: string | Addressable, signer?: Signer) =>
                    hardhatEthersHelpers.getContractAt(this._hre, nameOrAbi, address, signer),
                getContractAtFromArtifact: (artifact: Artifact, address: string | Addressable, signer?: Signer) =>
                    hardhatEthersHelpers.getContractAtFromArtifact(this._hre, artifact, address, signer),
                deployContract: hardhatEthersHelpers.deployContract.bind(null, this._hre) as any,
            };
        });
    }
}
