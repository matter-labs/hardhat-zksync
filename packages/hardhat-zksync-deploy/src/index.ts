import { task } from 'hardhat/config';

import { TASK_DEPLOY_ZKSYNC } from './task-names';
import './type-extensions';
import { zkSyncDeploy } from './task-actions';

export * from './deployer';

task(TASK_DEPLOY_ZKSYNC, 'Runs the deploy scripts for zkSync network')
    .addParam('script', 'A certain deploy script to be launched', '')
    .addOptionalParam(
        'zkSyncNetwork',
        "The zkSync network to connect to. The network with this name needs to be defined in 'hardhat.config' file."
    )
    .setAction(zkSyncDeploy);
