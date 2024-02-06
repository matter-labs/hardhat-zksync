import { extendConfig, extendEnvironment, task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';
import { int, string } from 'hardhat/internal/core/params/argumentTypes';
import { TASK_DEPLOY_ZKSYNC, TASK_DEPLOY_ZKSYNC_LIBRARIES } from './task-names';
import './type-extensions';
import { zkSyncDeploy, zkSyncLibraryDeploy } from './task-actions';
import { lazyObject } from 'hardhat/plugins';
import { Deployer } from './deployer';
import { getNetworkAddress, getWallet } from './plugin';
import { DEFAULT_DEPLOY_SCRIPTS_PATH, defaultAccountDeployerSettings } from './constants';

export * from './deployer';

extendConfig((config, userConfig) => {
    config.paths.deployPaths = userConfig.paths?.deployPaths ?? DEFAULT_DEPLOY_SCRIPTS_PATH;
    config.deployerAccounts = { ...defaultAccountDeployerSettings, ...userConfig?.deployerAccounts };
});

extendEnvironment(async (hre: HardhatRuntimeEnvironment) => {
    hre.network.zksync = hre.network.config.zksync ?? false;
    const wallet = await getWallet(hre, getNetworkAddress(hre));
    const deployer: Deployer = new Deployer(hre, wallet);
    hre.deployer = lazyObject(() => deployer);
});

task(TASK_DEPLOY_ZKSYNC, 'Runs the deploy scripts for zkSync network')
    .addParam('script', 'A certain deploy script to be launched', '')
    .addOptionalParam(
        'tags',
        'specify which deploy script to execute via tags, separated by commas',
        undefined,
        string
    )
    .setAction(zkSyncDeploy);

task(TASK_DEPLOY_ZKSYNC_LIBRARIES, 'Runs the library deploy for zkSync network')
    .addOptionalParam('privateKeyOrIndex', 'Private key or index of the account that will deploy the libraries', undefined)
    .addOptionalParam(
        'externalConfigObjectPath',
        'Config file imported in hardhat config file that represent HardhatUserConfig type variable',
        undefined,
    )
    .addOptionalParam(
        'exportedConfigObject',
        'Object in hardhat config file that represent HardhatUserConfig type variable',
        'config',
        string,
    )
    .addFlag('noAutoPopulateConfig', 'Flag to disable auto population of config file')
    .addFlag('compileAllContracts', 'Flag to compile all contracts at the end of the process')
    .setAction(zkSyncLibraryDeploy);

try {
    require.resolve('zksync2-js');
    console.info(chalk.red('The package zksync2-js is deprecated. Please use zksync-ethers.'));
} catch {}
