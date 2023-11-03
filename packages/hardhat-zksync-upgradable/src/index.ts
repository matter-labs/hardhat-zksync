import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import  './type-extensions';

import { extendEnvironment, subtask } from 'hardhat/internal/core/config/config-env';

import {
    TASK_COMPILE_SOLIDITY_COMPILE,
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
} from 'hardhat/builtin-tasks/task-names';

import { lazyObject } from 'hardhat/plugins';
import { HardhatUpgrades, RunCompilerArgs } from './interfaces';
import { extendCompilerOutputSelection, isFullZkSolcOutput } from './utils/utils-general';
import { validate } from './core/validate';
import { PROXY_SOURCE_NAMES } from './constants';
import { makeChangeProxyAdmin, makeGetInstanceFunction, makeTransferProxyAdminOwnership } from './admin';

extendEnvironment((hre) => {
    hre.zkUpgrades = lazyObject((): HardhatUpgrades => {
        const { makeDeployProxy } = require('./proxy-deployment/deploy-proxy');
        const { makeUpgradeProxy } = require('./proxy-upgrade/upgrade-proxy');
        const { makeValidateImplementation } = require('./validations/validate-implementation');
        const { makeDeployBeacon } = require('./proxy-deployment/deploy-beacon');
        const { makeDeployBeaconProxy } = require('./proxy-deployment/deploy-beacon-proxy');
        const { makeUpgradeBeacon } = require('./proxy-upgrade/upgrade-beacon');
        const { makeDeployProxyAdmin } = require('./proxy-deployment/deploy-proxy-admin');
        const { makeEstimateGasProxy } = require('./gas-estimation/estimate-gas-proxy');
        const { makeEstimateGasBeacon } = require('./gas-estimation/estimate-gas-beacon');
        const { makeEstimateGasBeaconProxy } = require('./gas-estimation/estimate-gas-beacon-proxy');
        return {
            deployProxy: makeDeployProxy(hre),
            upgradeProxy: makeUpgradeProxy(hre),
            validateImplementation: makeValidateImplementation(hre),
            deployBeacon: makeDeployBeacon(hre),
            deployBeaconProxy: makeDeployBeaconProxy(hre),
            upgradeBeacon: makeUpgradeBeacon(hre),
            deployProxyAdmin: makeDeployProxyAdmin(hre),
            admin: {
                getInstance: makeGetInstanceFunction(hre),
                changeProxyAdmin: makeChangeProxyAdmin(hre),
                transferProxyAdminOwnership: makeTransferProxyAdminOwnership(hre),
            },
            estimation: {
                estimateGasProxy: makeEstimateGasProxy(hre),
                estimateGasBeacon: makeEstimateGasBeacon(hre),
                estimateGasBeaconProxy: makeEstimateGasBeaconProxy(hre),
            },
        };
    });

    hre.config.solidity.compilers.forEach((compiler) => {
        extendCompilerOutputSelection(compiler);
    });
});

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

    return [...sourceNames, ...PROXY_SOURCE_NAMES];
});

subtask('verify:verify').setAction(async (args, hre, runSuper) => {
    const { verify } = await import('./verify/verify-proxy');
    return await verify(args, hre, runSuper);
});

export * from './type-extensions';