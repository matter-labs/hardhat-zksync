import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ZkSyncGenerator } from './extension-generator';
import { EthersGenerator } from './hardhat-ethers/extension-generator';

export class ExtensionGenerator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populatedExtension(): any {
        if (this._hre.network.zksync) {
            const zkSyncGenerator = new ZkSyncGenerator(this._hre);
            return zkSyncGenerator.populateExtension();
        }

        const ethersGenerators = new EthersGenerator(this._hre);
        return ethersGenerators.populateExtension();
    }
}

export interface Generator {
    populateExtension(): any;
}
