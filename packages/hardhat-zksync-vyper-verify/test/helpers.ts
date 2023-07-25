import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { TASK_CLEAN } from 'hardhat/builtin-tasks/task-names';
import '../src/type-extensions';
import path from 'path';
import { TASK_COMPILE_VYPER } from '../src/constants';
declare module 'mocha' {
    interface Context {
        env: HardhatRuntimeEnvironment;
    }
}

export function useEnvironment(fixtureProjectName: string, networkName = 'hardhat') {
    beforeEach('Loading hardhat environment', async function () {
        process.chdir(path.join(__dirname, 'fixture-projects', fixtureProjectName));
        process.env.HARDHAT_NETWORK = networkName;
        this.env = require('hardhat');
        await this.env.run(TASK_COMPILE_VYPER, { quiet: false});

    });

    afterEach('Resetting hardhat', function () {
        resetHardhatContext();
    });
}
