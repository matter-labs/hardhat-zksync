import { extendEnvironment, task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { TASK_DEPLOY_ZKSYNC, TASK_DEPLOY_ZKSYNC_LIBRARIES } from './task-names';
import './type-extensions';
import { zkSyncDeploy, zkSyncLibraryDeploy } from './task-actions';
import { int, string } from 'hardhat/internal/core/params/argumentTypes';

export * from './deployer';

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    hre.network.zksync = hre.network.config.zksync ?? false;
});

task(TASK_DEPLOY_ZKSYNC, 'Runs the deploy scripts for zkSync network')
    .addParam('script', 'A certain deploy script to be launched', '')
    .setAction(zkSyncDeploy);

task(TASK_DEPLOY_ZKSYNC_LIBRARIES, 'Runs the library deploy for zkSync network')
    .addOptionalParam('privateKey', 'Private key of the account that will deploy the libraries', undefined, string)
    .addOptionalParam('accountNumber', 'Network account index', 0, int)
    .addOptionalParam('externalConfigObjectPath', 'Config file imported in hardhat config file that represent HardhatUserConfig type variable', undefined)
    .addOptionalParam('exportedConfigObject', 'Object in hardhat config file that represent HardhatUserConfig type variable', 'config', string)
    .addFlag('noAutoPopulateConfig', 'Flag to disable auto population of config file')
    .addFlag('compileAllContracts', 'Flag to compile all contracts at the end of the process')
    .setAction(zkSyncLibraryDeploy);