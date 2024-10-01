import { extendConfig, extendEnvironment, types } from 'hardhat/config';
import chalk from 'chalk';
import { string } from 'hardhat/internal/core/params/argumentTypes';
import { TASK_DEPLOY_ZKSYNC, TASK_DEPLOY_ZKSYNC_LIBRARIES, TASK_DEPLOY_ZKSYNC_CONTRACT } from './task-names';
import './type-extensions';
import { deployZkSyncContract, zkSyncDeploy, zkSyncLibraryDeploy } from './task-actions';
import { DEFAULT_DEPLOY_SCRIPTS_PATH, defaultAccountDeployerSettings } from './constants';
import { DeployerExtension } from './deployer-extension';
import { taskWithEraTestNode } from './core/config-env';
export * from './deployer';

extendConfig((config, userConfig) => {
    config.paths.deployPaths = userConfig.paths?.deployPaths ?? DEFAULT_DEPLOY_SCRIPTS_PATH;
    config.deployerAccounts = { ...defaultAccountDeployerSettings, ...userConfig?.deployerAccounts };
});

extendEnvironment((hre) => {
    hre.network.zksync = hre.network.config.zksync ?? false;
    hre.network.forceDeploy = hre.network.config.forceDeploy ?? true;
    hre.network.deployPaths = hre.network.config.deployPaths
        ? typeof hre.network.config.deployPaths === 'string'
            ? [hre.network.config.deployPaths]
            : hre.network.config.deployPaths
        : typeof hre.config.paths.deployPaths === 'string'
          ? [hre.config.paths.deployPaths]
          : hre.config.paths.deployPaths;
    hre.deployer = new DeployerExtension(hre);
});

taskWithEraTestNode(TASK_DEPLOY_ZKSYNC, 'Runs the deploy scripts for ZKsync network', true)
    .addParam('script', 'A certain deploy script to be launched', '')
    .addOptionalParam('tags', 'specify which deploy script to execute via tags, separated by commas', undefined, string)
    .setAction(zkSyncDeploy);

taskWithEraTestNode(TASK_DEPLOY_ZKSYNC_LIBRARIES, 'Runs the library deploy for ZKsync network', true)
    .addOptionalParam(
        'privateKeyOrIndex',
        'Private key or index of the account that will deploy the libraries',
        undefined,
    )
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

taskWithEraTestNode(TASK_DEPLOY_ZKSYNC_CONTRACT, 'Runs the deploy scripts for ZKsync network', true)
    .addParam('contractName', 'A contract name or a FQN', '')
    .addOptionalVariadicPositionalParam(
        'constructorArgsParams',
        'Contract constructor arguments. Cannot be used if the --constructor-args option is provided',
        [],
    )
    .addOptionalParam(
        'constructorArgs',
        'Path to a Javascript module that exports the constructor arguments',
        undefined,
        types.inputFile,
    )
    .addOptionalParam('deploymentType', 'Type of deployment', undefined)
    .addOptionalParam('salt', 'Type of deployment', undefined)
    .addFlag('noCompile', 'Flag to disable auto compilation')
    .setAction(deployZkSyncContract);

try {
    require.resolve('zksync2-js');
    console.info(chalk.red('The package zksync2-js is deprecated. Please use zksync-ethers.'));
} catch {}
