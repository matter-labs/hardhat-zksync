import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { lazyObject } from 'hardhat/plugins';
import { makeUndefinedFunction } from '../utils';
import { Generator } from '../generator';
import { PlatformHardhatUpgradesOZ } from './interfaces';

export class OpenzeppelinGenerator implements Generator {
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

    private makePlatformFunctions(hre: HardhatRuntimeEnvironment): PlatformHardhatUpgradesOZ {
        const { makeDeployContract } = require('@openzeppelin/hardhat-upgrades/dist/deploy-contract');
        const { makeProposeUpgrade } = require('./platform/propose-upgrade');
        const {
            makeGetDefaultApprovalProcess,
        } = require('@openzeppelin/hardhat-upgrades/dist/platform/get-default-approval-process');

        return {
            ...this.makeFunctions(true),
            deployContract: makeDeployContract(hre, true),
            proposeUpgrade: makeProposeUpgrade(hre, true),
            getDefaultApprovalProcess: makeGetDefaultApprovalProcess(hre),
        };
    }
}
