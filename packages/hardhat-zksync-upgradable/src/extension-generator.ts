import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { lazyObject } from 'hardhat/plugins';
import { wrapMakeFunction } from './utils';
import { HardhatUpgrades, HardhatUpgradesOZ, makeUndefinedFunction, PlatformHardhatUpgrades } from './interfaces';

interface Generator {
    populateExtension(): any;
}

export class ExtensionGenerator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populatedExtension(): any {
        if (this._hre.network.zksync) {
            const zkSyncGenerator = new ZkSyncGenerator(this._hre);
            return zkSyncGenerator.populateExtension();
        } else {
            const openzeppelinGenerator = new OpenZeppelinGenerator(this._hre);
            return openzeppelinGenerator.populateExtension();
        }
    }
}

class ZkSyncGenerator implements Generator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    private makeFunctions(): HardhatUpgrades {
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
            deployProxy: wrapMakeFunction(this._hre, makeDeployProxy(this._hre)),
            upgradeProxy: wrapMakeFunction(this._hre, makeUpgradeProxy(this._hre)),
            validateImplementation: wrapMakeFunction(this._hre, makeValidateImplementation(this._hre)),
            deployBeacon: wrapMakeFunction(this._hre, makeDeployBeacon(this._hre)),
            deployBeaconProxy: wrapMakeFunction(this._hre, makeDeployBeaconProxy(this._hre)),
            upgradeBeacon: wrapMakeFunction(this._hre, makeUpgradeBeacon(this._hre)),
            deployProxyAdmin: wrapMakeFunction(this._hre, makeDeployProxyAdmin(this._hre)),
            admin: {
                getInstance: wrapMakeFunction(this._hre, makeGetInstanceFunction(this._hre)),
                changeProxyAdmin: wrapMakeFunction(this._hre, makeChangeProxyAdmin(this._hre)),
                transferProxyAdminOwnership: wrapMakeFunction(this._hre, makeTransferProxyAdminOwnership(this._hre)),
            },
            estimation: {
                estimateGasProxy: wrapMakeFunction(this._hre, makeEstimateGasProxy(this._hre)),
                estimateGasBeacon: wrapMakeFunction(this._hre, makeEstimateGasBeacon(this._hre)),
                estimateGasBeaconProxy: wrapMakeFunction(this._hre, makeEstimateGasBeaconProxy(this._hre)),
            },
            forceImport: makeUndefinedFunction(),
            silenceWarnings: makeUndefinedFunction(),
            validateUpgrade: makeUndefinedFunction(),
            deployImplementation: makeUndefinedFunction(),
            prepareUpgrade: makeUndefinedFunction(),
            beacon: {
                getImplementationAddress: makeUndefinedFunction(),
            },
            erc1967: {
                getAdminAddress: makeUndefinedFunction(),
                getImplementationAddress: makeUndefinedFunction(),
                getBeaconAddress: makeUndefinedFunction(),
            },
        };
    }

    public populateExtension(): any {
        this._hre.upgrades = lazyObject(() => this.makeFunctions() as HardhatUpgrades & HardhatUpgradesOZ);
        this._hre.zkUpgrades = lazyObject(() => this.makeFunctions());
    }
}

class OpenZeppelinGenerator implements Generator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populateExtension(): void {
        this._hre.upgrades = lazyObject(() => this.makeFunctions(false));
        this._hre.platform = lazyObject(() => this.makePlatformFunctions(this._hre));
    }

    private makeFunctions(platform: boolean) {
        const {
            silenceWarnings,
            getAdminAddress,
            getImplementationAddress,
            getBeaconAddress,
        } = require('@openzeppelin/upgrades-core');
        const { makeDeployProxy } = require('@openzeppelin/hardhat-upgrades/dist/deploy-proxy');
        const { makeDeployProxyAdmin } = require('@openzeppelin/hardhat-upgrades/dist/deploy-proxy-admin');
        const { makeUpgradeProxy } = require('@openzeppelin/hardhat-upgrades/dist/upgrade-proxy');
        const { makeValidateImplementation } = require('@openzeppelin/hardhat-upgrades/dist/validate-implementation');
        const { makeValidateUpgrade } = require('@openzeppelin/hardhat-upgrades/dist/validate-upgrade');
        const { makeDeployImplementation } = require('@openzeppelin/hardhat-upgrades/dist/deploy-implementation');
        const { makePrepareUpgrade } = require('@openzeppelin/hardhat-upgrades/dist/prepare-upgrade');
        const { makeDeployBeacon } = require('@openzeppelin/hardhat-upgrades/dist/deploy-beacon');
        const { makeDeployBeaconProxy } = require('@openzeppelin/hardhat-upgrades/dist/deploy-beacon-proxy');
        const { makeUpgradeBeacon } = require('@openzeppelin/hardhat-upgrades/dist/upgrade-beacon');
        const { makeForceImport } = require('@openzeppelin/hardhat-upgrades/dist/force-import');
        const {
            makeChangeProxyAdmin,
            makeTransferProxyAdminOwnership,
            makeGetInstanceFunction,
        } = require('@openzeppelin/hardhat-upgrades/dist/admin');
        const { getImplementationAddressFromBeacon } = require('@openzeppelin/upgrades-core/dist/impl-address');

        return {
            silenceWarnings,
            deployProxy: makeDeployProxy(this._hre, platform),
            upgradeProxy: makeUpgradeProxy(this._hre, platform), // block on platform
            validateImplementation: makeValidateImplementation(this._hre),
            validateUpgrade: makeValidateUpgrade(this._hre),
            deployImplementation: makeDeployImplementation(this._hre, platform),
            prepareUpgrade: makePrepareUpgrade(this._hre, platform),
            deployBeacon: makeDeployBeacon(this._hre, platform), // block on platform
            deployBeaconProxy: makeDeployBeaconProxy(this._hre, platform),
            upgradeBeacon: makeUpgradeBeacon(this._hre, platform), // block on platform
            deployProxyAdmin: makeDeployProxyAdmin(this._hre, platform), // block on platform
            forceImport: makeForceImport(this._hre),
            admin: {
                getInstance: makeGetInstanceFunction(this._hre),
                changeProxyAdmin: makeChangeProxyAdmin(this._hre, platform), // block on platform
                transferProxyAdminOwnership: makeTransferProxyAdminOwnership(this._hre, platform), // block on platform
            },
            erc1967: {
                getAdminAddress: (proxyAddress: string) => getAdminAddress(this._hre.network.provider, proxyAddress),
                getImplementationAddress: (proxyAddress: string) =>
                    getImplementationAddress(this._hre.network.provider, proxyAddress),
                getBeaconAddress: (proxyAddress: string) => getBeaconAddress(this._hre.network.provider, proxyAddress),
            },
            beacon: {
                getImplementationAddress: (beaconAddress: string) =>
                    getImplementationAddressFromBeacon(this._hre.network.provider, beaconAddress),
            },
            estimation: {
                estimateGasProxy: makeUndefinedFunction(),
                estimateGasBeacon: makeUndefinedFunction(),
                estimateGasBeaconProxy: makeUndefinedFunction(),
            },
        };
    }

    private makePlatformFunctions(hre: HardhatRuntimeEnvironment): PlatformHardhatUpgrades {
        const { makeDeployContract } = require('./deploy-contract');
        const { makeProposeUpgrade } = require('./platform/propose-upgrade');
        const { makeGetDefaultApprovalProcess } = require('./platform/get-default-approval-process');

        return {
            ...this.makeFunctions(true),
            deployContract: makeDeployContract(hre, true),
            proposeUpgrade: makeProposeUpgrade(hre, true),
            getDefaultApprovalProcess: makeGetDefaultApprovalProcess(hre),
        };
    }
}
