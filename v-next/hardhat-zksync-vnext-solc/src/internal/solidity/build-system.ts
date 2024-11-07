import {SolidityBuildSystemImplementation, SolidityBuildSystemOptions} from "@ignored/hardhat-vnext/dist/src/internal/builtin-plugins/solidity/build-system/build-system.js";

export class ZKsyncSolidityBuildSystemImplementation extends SolidityBuildSystemImplementation {
    constructor(options: SolidityBuildSystemOptions) {
        super(options);
      }

      public override async getRootFilePaths(): Promise<string[]> {
        console.log('ALOOOOOOOO!!!');
        return super.getRootFilePaths();
      }
}