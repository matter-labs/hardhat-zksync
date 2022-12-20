import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { TASK_CLEAN } from 'hardhat/builtin-tasks/task-names';
import path from 'path';

import '@matterlabs/hardhat-zksync-verify/src/type-extensions';

declare module 'mocha' {
    interface Context {
        env: HardhatRuntimeEnvironment;
    }
}

export function useEnvironmentWithLocalSetup(fixtureProjectName: string, networkName = 'zkSyncNetwork') {
    const fixtureProjectDir = path.resolve(__dirname, 'fixture-projects', fixtureProjectName);

    before('Loading hardhat environment', async function () {
        process.chdir(fixtureProjectDir);
        process.env.HARDHAT_NETWORK = networkName;

        this.env = require('hardhat');
        this.env.run(TASK_CLEAN);
    });

    after(async function () {
        resetHardhatContext();
    });
}
