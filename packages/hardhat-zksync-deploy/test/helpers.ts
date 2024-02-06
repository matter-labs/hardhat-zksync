import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';
import { ScriptManager } from '../src/script-manager';

declare module 'mocha' {
    interface Context {
        env: HardhatRuntimeEnvironment;
    }
}

export function useEnvironment(fixtureProjectName: string, networkName = 'hardhat') {
    beforeEach('Loading hardhat environment', function () {
        process.chdir(path.join(__dirname, 'fixture-projects', fixtureProjectName));
        process.env.HARDHAT_NETWORK = networkName;

        this.env = require('hardhat');
        this.scriptManager = new ScriptManager(this.env);
    });

    afterEach('Resetting hardhat', function () {
        resetHardhatContext();
    });
}
