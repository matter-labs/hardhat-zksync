import { extendConfig, task } from 'hardhat/config';

import { TASK_DEPLOY_ZKSYNC } from './task-names';
import './type-extensions';
import { callDeployScripts } from './plugin';
import { ZkDeployConfig } from './types';

export * from './deployer';

extendConfig((config) => {
    const defaultConfig: ZkDeployConfig = {
        zkSyncNetwork: 'unknown',
        ethNetwork: 'unknown'
    };
    config.zkSyncDeploy = { ...defaultConfig, ...config.zkSyncDeploy };
});

task(TASK_DEPLOY_ZKSYNC, 'Runs the deploy scripts for zkSync network')
    .addParam('script', 'A certain deploy script to be launched', '')
    .setAction(async function (taskArgs, hre) {
        await callDeployScripts(hre, taskArgs.script);
    });
