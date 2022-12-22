import { extendEnvironment, task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { TASK_DEPLOY_ZKSYNC } from './task-names';
import './type-extensions';
import { zkSyncDeploy } from './task-actions';

export * from './deployer';

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    hre.network.zksync = hre.network.config.zksync ?? false;
});

task(TASK_DEPLOY_ZKSYNC, 'Runs the deploy scripts for zkSync network')
    .addParam('script', 'A certain deploy script to be launched', '')
    .setAction(zkSyncDeploy);
