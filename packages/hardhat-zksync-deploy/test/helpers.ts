import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';

declare module 'mocha' {
    interface Context {
        env: HardhatRuntimeEnvironment;
    }
}

declare module 'hardhat/types/runtime' {
    interface HardhatRuntimeEnvironment {
        zksyncNetwork?: string;
    }
}

export function useEnvironment(fixtureProjectName: string, zksyncNetworkName?: string) {
    beforeEach('Loading hardhat environment', function () {
        process.chdir(path.join(__dirname, 'fixture-projects', fixtureProjectName));

        this.env = require('hardhat');
        this.env.zksyncNetwork = zksyncNetworkName;
    });

    afterEach('Resetting hardhat', function () {
        resetHardhatContext();
    });
}
