import '@matterlabs/hardhat-zksync-solc';
import './type-extensions';

import { extendEnvironment, subtask, task, types } from 'hardhat/internal/core/config/config-env';

import {
    TASK_COMPILE_SOLIDITY_COMPILE,
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
} from 'hardhat/builtin-tasks/task-names';

import { RunCompilerArgs } from './interfaces';
import { extendCompilerOutputSelection, isFullZkSolcOutput } from './utils/utils-general';
import { validate } from './core/validate';
import { deployZkSyncBeacon, deployZkSyncProxy, upgradeZkSyncBeacon, upgradeZkSyncProxy } from './task-actions';
import {
    TASK_DEPLOY_ZKSYNC_BEACON,
    TASK_DEPLOY_ZKSYNC_PROXY,
    TASK_UPGRADE_ZKSYNC_BEACON,
    TASK_UPGRADE_ZKSYNC_PROXY,
} from './task-names';
import { getUpgradableContracts } from './utils';

import { ExtensionGenerator } from './extension-generator';

extendEnvironment((hre) => {
    const extesionGenerator = new ExtensionGenerator(hre);
    extesionGenerator.populatedExtension();
    hre.config.solidity.compilers.forEach((compiler) => {
        extendCompilerOutputSelection(compiler);
    });
});

task(TASK_DEPLOY_ZKSYNC_BEACON, 'Runs the beaccon deploy for zkSync network')
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
    .addOptionalParam('initializer', 'Initializer function name', undefined)
    .addOptionalParam('deploymentTypeImpl', 'Type of deployment for implementation', undefined)
    .addOptionalParam('deploymentTypeProxy', 'Type of deployment for proxy', undefined)
    .addOptionalParam('saltImpl', 'Salt for implementation deployment', undefined)
    .addOptionalParam('saltProxy', 'Salt for proxy deployment', undefined)
    .addFlag('noCompile', 'No compile flag')
    .setAction(deployZkSyncBeacon);

task(TASK_DEPLOY_ZKSYNC_PROXY, 'Deploy proxy for zkSync network')
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
    .addOptionalParam('initializer', 'Initializer function name', undefined)
    .addOptionalParam('deploymentTypeImpl', 'Type of deployment for implementation', undefined)
    .addOptionalParam('deploymentTypeProxy', 'Type of deployment for proxy', undefined)
    .addOptionalParam('saltImpl', 'Salt for implementation deployment', undefined)
    .addOptionalParam('saltProxy', 'Salt for proxy deployment', undefined)
    .addFlag('noCompile', 'No compile flag')
    .setAction(deployZkSyncProxy);

task(TASK_UPGRADE_ZKSYNC_BEACON, 'Runs the beacon upgrade for zkSync network')
    .addParam('contractName', 'A contract name or a FQN', '')
    .addParam('beaconAddress', 'Beacon address of the deployed contract', '')
    .addOptionalParam('deploymentType', 'Type of deployment', undefined)
    .addOptionalParam('salt', 'Salt for deployment', undefined)
    .addFlag('noCompile', 'No compile flag')
    .setAction(upgradeZkSyncBeacon);

task(TASK_UPGRADE_ZKSYNC_PROXY, 'Runs the proxy upgrade for zkSync network')
    .addParam('contractName', 'A contract name or a FQN', '')
    .addParam('proxyAddress', 'Proxy address of the deployed contract', '')
    .addOptionalParam('deploymentType', 'Type of deployment', undefined)
    .addOptionalParam('salt', 'Salt for deployment', undefined)
    .addFlag('noCompile', 'No compile flag')
    .setAction(upgradeZkSyncProxy);

subtask(TASK_COMPILE_SOLIDITY_COMPILE, async (args: RunCompilerArgs, hre, runSuper) => {
    const { solcInputOutputDecoder } = await import('@openzeppelin/upgrades-core');
    const { writeValidations } = await import('./validations/validations');

    const { output, solcBuild } = await runSuper();

    if (isFullZkSolcOutput(output)) {
        const decodeSrc = solcInputOutputDecoder(args.input, output);
        const validations = validate(output, decodeSrc, args.solcVersion);
        await writeValidations(hre, validations);
    }

    return { output, solcBuild };
});

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, async (args: RunCompilerArgs, _, runSuper) => {
    const sourceNames = await runSuper();

    const upgradableContracts = getUpgradableContracts();
    return [
        ...sourceNames,
        ...[
            upgradableContracts.ProxyAdmin,
            upgradableContracts.TransparentUpgradeableProxy,
            upgradableContracts.BeaconProxy,
            upgradableContracts.UpgradeableBeacon,
            upgradableContracts.ERC1967Proxy,
        ],
    ];
});

subtask('verify:verify').setAction(async (args, hre, runSuper) => {
    const { verify } = await import('./verify/verify-proxy');
    return await verify(args, hre, runSuper);
});
