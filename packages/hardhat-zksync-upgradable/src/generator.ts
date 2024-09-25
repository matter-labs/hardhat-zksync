import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ZkSyncGenerator } from './extension-generator';
import { OpenzeppelinGenerator } from './openzeppelin-hardhat-upgrades/extension-generator';

export class ExtensionGenerator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populateExtension(): void {
        if (this._hre.network.zksync) {
            const zkSyncGenerator = new ZkSyncGenerator(this._hre);
            zkSyncGenerator.populateExtension();
            return;
        }

        const openzeppelinGenerators = new OpenzeppelinGenerator(this._hre);
        openzeppelinGenerators.populateExtension();
    }
}

export interface Generator {
    populateExtension(): void;
}
