import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { OpenzeppelinGenerator } from './openzeppelin-hardhat-upgrades/extension-generator';
import { ZkSyncGenerator } from './extension-generator';

export interface Generator {
    populateExtension(): any;
}

export class ExtensionGenerator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populatedExtension(): any {
        if (this._hre.network.zksync) {
            const zkSyncGenerator = new ZkSyncGenerator(this._hre);
            return zkSyncGenerator.populateExtension();
        } else {
            const openzeppelinGenerator = new OpenzeppelinGenerator(this._hre);
            return openzeppelinGenerator.populateExtension();
        }
    }
}
