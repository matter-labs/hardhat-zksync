import { extendConfig, task } from 'hardhat/config';

import { TASK_DEPLOY_ZKSYNC } from './task-names';
import './type-extensions';
import { callDeployScripts } from './plugin';

export * from './deployer';

extendConfig((config) => {
    const defaultConfig = {
        zkSyncRpc: 'unknown',
        l1Network: 'unknown',
    };
    config.zkSyncDeploy = { ...defaultConfig, ...config.zkSyncDeploy };
});

task(TASK_DEPLOY_ZKSYNC, 'Runs the deploy scripts for zkSync network')
    .addParam('script', 'A certain deploy script to be launched', '')
    .setAction(async function (taskArgs, hre) {
        await callDeployScripts(hre, taskArgs.script);
    });
