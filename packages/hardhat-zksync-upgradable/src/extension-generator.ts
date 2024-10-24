import { lazyObject } from 'hardhat/plugins';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { makeUndefinedFunction, wrapMakeFunction } from './utils';
import { HardhatZksyncUpgrades } from './interfaces';
import { HardhatUpgradesOZ } from './openzeppelin-hardhat-upgrades/interfaces';
import { Generator } from './generator';

export class ZkSyncGenerator implements Generator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populateExtension(): void {
        this._hre.upgrades = lazyObject(() => this.makeFunctions() as HardhatUpgradesOZ & HardhatZksyncUpgrades);
        this._hre.zkUpgrades = lazyObject(() => this.makeFunctions());
    }

    private makeFunctions(): HardhatZksyncUpgrades {
        const { makeDeployProxy } = require('./proxy-deployment/deploy-proxy');
        const { makeUpgradeProxy } = require('./proxy-upgrade/upgrade-proxy');
        const { makeValidateImplementation } = require('./validations/validate-implementation');
        const { makeDeployBeacon } = require('./proxy-deployment/deploy-beacon');
        const { makeDeployBeaconProxy } = require('./proxy-deployment/deploy-beacon-proxy');
        const { makeUpgradeBeacon } = require('./proxy-upgrade/upgrade-beacon');
        const { makeEstimateGasProxy } = require('./gas-estimation/estimate-gas-proxy');
        const { makeEstimateGasBeacon } = require('./gas-estimation/estimate-gas-beacon');
        const { makeEstimateGasBeaconProxy } = require('./gas-estimation/estimate-gas-beacon-proxy');
        const { makeChangeProxyAdmin, makeTransferProxyAdminOwnership } = require('./admin');
        return {
            deployProxy: wrapMakeFunction(this._hre, makeDeployProxy(this._hre)),
            upgradeProxy: wrapMakeFunction(this._hre, makeUpgradeProxy(this._hre)),
            validateImplementation: wrapMakeFunction(this._hre, makeValidateImplementation(this._hre)),
            deployBeacon: wrapMakeFunction(this._hre, makeDeployBeacon(this._hre)),
            deployBeaconProxy: wrapMakeFunction(this._hre, makeDeployBeaconProxy(this._hre)),
            upgradeBeacon: wrapMakeFunction(this._hre, makeUpgradeBeacon(this._hre)),
            admin: {
                changeProxyAdmin: wrapMakeFunction(this._hre, makeChangeProxyAdmin(this._hre)),
                transferProxyAdminOwnership: wrapMakeFunction(this._hre, makeTransferProxyAdminOwnership(this._hre)),
            },
            estimation: {
                estimateGasProxy: wrapMakeFunction(this._hre, makeEstimateGasProxy(this._hre)),
                estimateGasBeacon: wrapMakeFunction(this._hre, makeEstimateGasBeacon(this._hre)),
                estimateGasBeaconProxy: wrapMakeFunction(this._hre, makeEstimateGasBeaconProxy(this._hre)),
            },
            // Properties from oz-upgrades
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
}
