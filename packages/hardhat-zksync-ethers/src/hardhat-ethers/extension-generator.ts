import { lazyObject } from 'hardhat/plugins';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Generator } from '../generator';

export class EthersGenerator implements Generator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populateExtension(): any {
        return lazyObject(() => {
            const hardhatEthersHelpers = require('@nomiclabs/hardhat-ethers/internal/helpers');
            const { createProviderProxy } = require('@nomiclabs/hardhat-ethers/internal/provider-proxy');
            const { ethers } = require('ethers');
            const provider = new createProviderProxy(this._hre.network.provider);
            return {
                ...ethers,
                provider,
                getSigner: (address: string) => hardhatEthersHelpers.getSigner(this._hre, address),
                getSigners: () => hardhatEthersHelpers.getSigners(this._hre),
                getImpersonatedSigner: (address: string) =>
                    hardhatEthersHelpers.getImpersonatedSigner(this._hre, address),
                getContractFactory: hardhatEthersHelpers.getContractFactory.bind(null, this._hre) as any,
                getContractFactoryFromArtifact: hardhatEthersHelpers.getContractFactoryFromArtifact.bind(
                    null,
                    this._hre,
                ),
                getContractAt: hardhatEthersHelpers.getContractAt.bind(null, this._hre),
                getContractAtFromArtifact: hardhatEthersHelpers.getContractAtFromArtifact.bind(null, this._hre),
                deployContract: hardhatEthersHelpers.deployContract.bind(null, this._hre) as any,
            };
        });
    }
}
