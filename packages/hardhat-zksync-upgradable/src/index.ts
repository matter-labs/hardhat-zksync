import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import './type-extensions';

import { extendEnvironment, subtask } from 'hardhat/internal/core/config/config-env';

import { TASK_COMPILE_SOLIDITY_COMPILE, TASK_COMPILE_SOLIDITY_COMPILE_SOLC } from 'hardhat/builtin-tasks/task-names';

import { lazyObject } from 'hardhat/plugins';
import { HardhatUpgrades, RunCompilerArgs } from './interfaces';
import { isFullZkSolcOutput } from './utils/utils-general';
import { validate } from './core/validate';

extendEnvironment((hre) => {
    hre.zkUpgrades = lazyObject((): HardhatUpgrades => {
        const { makeDeployProxy } = require('./proxy-deployment/deploy-proxy');
        const { makeUpgradeProxy } = require('./proxy-upgrade/upgrade-proxy');
        const { makeValidateImplementation } = require('./validations/validate-implementation');
        const { makeDeployBeacon } = require('./proxy-deployment/deploy-beacon');
        const { makeDeployBeaconProxy } = require('./proxy-deployment/deploy-beacon-proxy');
        const { makeUpgradeBeacon } = require('./proxy-upgrade/upgrade-beacon');
        const { makeDeployProxyAdmin } = require('./proxy-deployment/deploy-proxy-admin');
        return {
            deployProxy: makeDeployProxy(hre),
            upgradeProxy: makeUpgradeProxy(hre),
            validateImplementation: makeValidateImplementation(hre),
            deployBeacon: makeDeployBeacon(hre),
            deployBeaconProxy: makeDeployBeaconProxy(hre),
            upgradeBeacon: makeUpgradeBeacon(hre),
            deployProxyAdmin: makeDeployProxyAdmin(hre),
        };
    });
});

subtask(TASK_COMPILE_SOLIDITY_COMPILE, async (args: RunCompilerArgs, hre) => {
    const { solcInputOutputDecoder } = await import('@openzeppelin/upgrades-core');
    const { writeValidations } = await import('./validations/validations');

    const { output, solcBuild } = await hre.run(TASK_COMPILE_SOLIDITY_COMPILE_SOLC, args);

    if (isFullZkSolcOutput(output)) {
        const decodeSrc = solcInputOutputDecoder(args.input, output);
        const validations = validate(output, decodeSrc, args.solcVersion);
        await writeValidations(hre, validations);
    }

    return { output, solcBuild };
});
