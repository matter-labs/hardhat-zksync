import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { TASK_CLEAN } from 'hardhat/builtin-tasks/task-names';
import path from 'path';

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
        const _ = this.env.run(TASK_CLEAN);
        this.pathEscape = process.env.PLATFORM_OS?.includes('windows') ? '\\' : "/";
    });

    afterEach('Resetting hardhat', function () {
        resetHardhatContext();
    });
}
