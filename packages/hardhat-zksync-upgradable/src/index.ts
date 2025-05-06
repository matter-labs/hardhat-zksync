import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-ethers';
import './type-extensions';

import { extendEnvironment, subtask, task, types } from 'hardhat/internal/core/config/config-env';

import { TASK_COMPILE_SOLIDITY_COMPILE } from 'hardhat/builtin-tasks/task-names';

import { RunCompilerArgs } from './interfaces';
import { isFullZkSolcOutput } from './utils/utils-general';
import { validate } from './core/validate';

import {
    TASK_DEPLOY_ZKSYNC_BEACON,
    TASK_DEPLOY_ZKSYNC_PROXY,
    TASK_UPGRADE_ZKSYNC_BEACON,
    TASK_UPGRADE_ZKSYNC_PROXY,
} from './task-names';
import { deployZkSyncBeacon, deployZkSyncProxy, upgradeZkSyncBeacon, upgradeZkSyncProxy } from './task-actions';
import { ExtensionGenerator } from './generator';
import { ZkSyncUpgradablePluginError } from './errors';
import '@matterlabs/hardhat-zksync-telemetry';

extendEnvironment((hre) => {
    const extesionGenerator = new ExtensionGenerator(hre);
    extesionGenerator.populateExtension();
});

task(TASK_DEPLOY_ZKSYNC_BEACON, 'Runs the beaccon deploy for ZKsync network')
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
    .addOptionalParam('initialOwner', 'Initial owner of the proxy', undefined)
    .addFlag('noCompile', 'No compile flag')
    .setAction(deployZkSyncBeacon);

task(TASK_DEPLOY_ZKSYNC_PROXY, 'Deploy proxy for ZKsync network')
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
    .addOptionalParam('initialOwner', 'Initial owner of the proxy', undefined)
    .addFlag('noCompile', 'No compile flag')
    .setAction(deployZkSyncProxy);

task(TASK_UPGRADE_ZKSYNC_BEACON, 'Runs the beacon upgrade for ZKsync network')
    .addParam('contractName', 'A contract name or a FQN', '')
    .addParam('beaconAddress', 'Beacon address of the deployed contract', '')
    .addOptionalParam('deploymentType', 'Type of deployment', undefined)
    .addOptionalParam('salt', 'Salt for deployment', undefined)
    .addFlag('noCompile', 'No compile flag')
    .setAction(upgradeZkSyncBeacon);

task(TASK_UPGRADE_ZKSYNC_PROXY, 'Runs the proxy upgrade for ZKsync network')
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

subtask('verify:etherscan').setAction(async (args, hre, runSuper) => {
    if (!hre.network.zksync) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const { verify } = await import('@openzeppelin/hardhat-upgrades/dist/verify-proxy');
        return await verify(args, hre, runSuper);
    }

    const { verify } = await import('./verify/verify-proxy');
    return await verify(args, hre, runSuper);
});

subtask('verify:zksync-etherscan').setAction(async (args, hre, runSuper) => {
    if (!hre.network.zksync) {
        throw new ZkSyncUpgradablePluginError(
            'This task is only available for zkSync network, use `verify:verify` instead',
        );
    }

    const { verify } = await import('./verify/verify-proxy');
    return await verify(args, hre, runSuper);
});

subtask('verify:zksync-blockexplorer').setAction(async (args, hre, runSuper) => {
    if (!hre.network.zksync) {
        throw new ZkSyncUpgradablePluginError(
            'This task is only available for zkSync network, use `verify:verify` instead',
        );
    }

    const { verify } = await import('./verify/verify-proxy');
    return await verify(args, hre, runSuper);
});

export * from './type-extensions';
