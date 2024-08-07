import '@matterlabs/hardhat-zksync-solc';
import './type-extensions';

import { extendEnvironment, subtask, task, types } from 'hardhat/internal/core/config/config-env';

import {
    TASK_COMPILE_SOLIDITY_COMPILE,
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
} from 'hardhat/builtin-tasks/task-names';

import { lazyObject } from 'hardhat/plugins';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HardhatUpgrades, HardhatZksyncUpgrades, RunCompilerArgs } from './interfaces';
import { extendCompilerOutputSelection, isFullZkSolcOutput } from './utils/utils-general';
import { validate } from './core/validate';
import {
    TASK_DEPLOY_ZKSYNC_BEACON,
    TASK_DEPLOY_ZKSYNC_PROXY,
    TASK_UPGRADE_ZKSYNC_BEACON,
    TASK_UPGRADE_ZKSYNC_PROXY,
} from './task-names';
import { deployZkSyncBeacon, deployZkSyncProxy, upgradeZkSyncBeacon, upgradeZkSyncProxy } from './task-actions';
import { checkOpenzeppelinVersions, getUpgradableContracts } from './utils';
import { silenceWarnings } from './log';

extendEnvironment((hre) => {
    if (hre.network.zksync) {
        hre.zkUpgrades = lazyObject(() => {
            return makeZkSyncFunction(hre) as HardhatZksyncUpgrades & HardhatUpgrades;
        });

        hre.upgrades = lazyObject(() => {
            return makeZkSyncFunction(hre) as HardhatZksyncUpgrades & HardhatUpgrades;
        });

        hre.defender = undefined;

        hre.config.solidity.compilers.forEach((compiler) => {
            extendCompilerOutputSelection(compiler);
        });
    } else {
        hre.upgrades = lazyObject(() => {
            return makeUpgradesFunctions(hre) as HardhatZksyncUpgrades & HardhatUpgrades;
        });

        warnOnHardhatDefender();

        hre.defender = lazyObject(() => {
            return makeDefenderFunctions(hre);
        });

        hre.zkUpgrades = undefined as any;
    }
});

function warnOnHardhatDefender() {
    if (tryRequire('@openzeppelin/hardhat-defender', true)) {
        const { logWarning } = require('@openzeppelin/upgrades-core');
        logWarning('The @openzeppelin/hardhat-defender package is deprecated.', [
            'Uninstall the @openzeppelin/hardhat-defender package.',
            'OpenZeppelin Defender integration is included as part of the Hardhat Upgrades plugin.',
        ]);
    }
}

function tryRequire(id: string, resolveOnly?: boolean) {
    try {
        if (resolveOnly) {
            require.resolve(id);
        } else {
            require(id);
        }
        return true;
    } catch (e: any) {
        // do nothing
    }
    return false;
}

function makeFunctions(hre: HardhatRuntimeEnvironment, defender: boolean): HardhatUpgrades {
    const { getImplementationAddressFromBeacon } = require('@openzeppelin/upgrades-core/dist/impl-address');
    const {
        getAdminAddress,
        getImplementationAddress,
        getBeaconAddress,
    } = require('@openzeppelin/upgrades-core/dist/eip-1967');
    const { makeDeployProxy } = require('@openzeppelin/hardhat-upgrades/dist/deploy-proxy');
    const { makeUpgradeProxy } = require('@openzeppelin/hardhat-upgrades/dist/upgrade-proxy');
    const { makeValidateImplementation } = require('@openzeppelin/hardhat-upgrades/dist/validate-implementation');
    const { makeValidateUpgrade } = require('@openzeppelin/hardhat-upgrades/dist/validate-upgrade');
    const { makeDeployImplementation } = require('@openzeppelin/hardhat-upgrades/dist/deploy-implementation');
    const { makePrepareUpgrade } = require('@openzeppelin/hardhat-upgrades/dist/prepare-upgrade');
    const { makeDeployBeacon } = require('@openzeppelin/hardhat-upgrades/dist/deploy-beacon');
    const { makeDeployBeaconProxy } = require('@openzeppelin/hardhat-upgrades/dist/deploy-beacon-proxy');
    const { makeUpgradeBeacon } = require('@openzeppelin/hardhat-upgrades/dist/upgrade-beacon');
    const { makeForceImport } = require('@openzeppelin/hardhat-upgrades/dist/force-import');
    /* eslint-disable @typescript-eslint/no-shadow */
    const {
        makeChangeProxyAdmin,
        makeTransferProxyAdminOwnership,
    } = require('@openzeppelin/hardhat-upgrades/dist/admin');
    /* eslint-enable @typescript-eslint/no-shadow */

    return {
        silenceWarnings,
        deployProxy: makeDeployProxy(hre, defender),
        upgradeProxy: makeUpgradeProxy(hre, defender), // block on defender
        validateImplementation: makeValidateImplementation(hre),
        validateUpgrade: makeValidateUpgrade(hre),
        deployImplementation: makeDeployImplementation(hre, defender),
        prepareUpgrade: makePrepareUpgrade(hre, defender),
        deployBeacon: makeDeployBeacon(hre, defender), // block on defender
        deployBeaconProxy: makeDeployBeaconProxy(hre, defender),
        upgradeBeacon: makeUpgradeBeacon(hre, defender), // block on defender
        forceImport: makeForceImport(hre),
        admin: {
            changeProxyAdmin: makeChangeProxyAdmin(hre, defender), // block on defender
            transferProxyAdminOwnership: makeTransferProxyAdminOwnership(hre, defender), // block on defender
        },
        erc1967: {
            getAdminAddress: (proxyAddress: string) => getAdminAddress(hre.network.provider, proxyAddress),
            getImplementationAddress: (proxyAddress: string) =>
                getImplementationAddress(hre.network.provider, proxyAddress),
            getBeaconAddress: (proxyAddress: string) => getBeaconAddress(hre.network.provider, proxyAddress),
        },
        beacon: {
            getImplementationAddress: (beaconAddress: string) =>
                getImplementationAddressFromBeacon(hre.network.provider, beaconAddress),
        },
    };
}

function makeDefenderFunctions(hre: HardhatRuntimeEnvironment) {
    const { makeDeployContract } = require('@openzeppelin/hardhat-upgrades/dist/deploy-contract');
    const {
        makeProposeUpgradeWithApproval,
    } = require('@openzeppelin/hardhat-upgrades/dist/defender/propose-upgrade-with-approval');
    const {
        makeGetDeployApprovalProcess,
        makeGetUpgradeApprovalProcess,
    } = require('@openzeppelin/hardhat-upgrades/dist/defender/get-approval-process');

    const getUpgradeApprovalProcess = makeGetUpgradeApprovalProcess(hre);

    return {
        ...makeFunctions(hre, true),
        deployContract: makeDeployContract(hre, true),
        proposeUpgradeWithApproval: makeProposeUpgradeWithApproval(hre, true),
        getDeployApprovalProcess: makeGetDeployApprovalProcess(hre),
        getUpgradeApprovalProcess,
        getDefaultApprovalProcess: getUpgradeApprovalProcess, // deprecated, is an alias for getUpgradeApprovalProcess
    };
}

function makeUpgradesFunctions(hre: HardhatRuntimeEnvironment): HardhatUpgrades {
    return makeFunctions(hre, false);
}

function makeZkSyncFunction(hre: HardhatRuntimeEnvironment): HardhatZksyncUpgrades {
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
    const { makeGetInstanceFunction, makeChangeProxyAdmin, makeTransferProxyAdminOwnership } = require('./admin');
    return {
        deployProxy: checkOpenzeppelinVersions(makeDeployProxy(hre)),
        upgradeProxy: checkOpenzeppelinVersions(makeUpgradeProxy(hre)),
        validateImplementation: checkOpenzeppelinVersions(makeValidateImplementation(hre)),
        deployBeacon: checkOpenzeppelinVersions(makeDeployBeacon(hre)),
        deployBeaconProxy: checkOpenzeppelinVersions(makeDeployBeaconProxy(hre)),
        upgradeBeacon: checkOpenzeppelinVersions(makeUpgradeBeacon(hre)),
        deployProxyAdmin: checkOpenzeppelinVersions(makeDeployProxyAdmin(hre)),
        admin: {
            getInstance: checkOpenzeppelinVersions(makeGetInstanceFunction(hre)),
            changeProxyAdmin: checkOpenzeppelinVersions(makeChangeProxyAdmin(hre)),
            transferProxyAdminOwnership: checkOpenzeppelinVersions(makeTransferProxyAdminOwnership(hre)),
        },
        estimation: {
            estimateGasProxy: checkOpenzeppelinVersions(makeEstimateGasProxy(hre)),
            estimateGasBeacon: checkOpenzeppelinVersions(makeEstimateGasBeacon(hre)),
            estimateGasBeaconProxy: checkOpenzeppelinVersions(makeEstimateGasBeaconProxy(hre)),
        },
    };
}

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

export * from './type-extensions';
