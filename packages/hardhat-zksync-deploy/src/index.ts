import { extendEnvironment, task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { TASK_DEPLOY_ZKSYNC, TASK_DEPLOY_ZKSYNC_LIBRARIES } from './task-names';
import './type-extensions';
import { zkSyncDeploy, zkSyncLibraryDeploy } from './task-actions';

export * from './deployer';

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    hre.network.zksync = hre.network.config.zksync ?? false;
});

task(TASK_DEPLOY_ZKSYNC, 'Runs the deploy scripts for zkSync network')
    .addParam('script', 'A certain deploy script to be launched', '')
    .setAction(zkSyncDeploy);

task(TASK_DEPLOY_ZKSYNC_LIBRARIES, 'Runs the library deploy for zkSync network')
    .addParam('wallet', 'Wallet key for deployment', '')
    .addOptionalParam('exportedConfigName', 'Exported HardhatUserConfig type variable from hardhat config file', undefined)
    .setAction(zkSyncLibraryDeploy);
