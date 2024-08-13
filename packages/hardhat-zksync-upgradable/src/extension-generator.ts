import { lazyObject } from 'hardhat/plugins';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { tryRequire, wrapMakeFunction } from './utils';
import { HardhatUpgradesOZ, HardhatZksyncUpgrades, makeUndefinedFunction } from './interfaces';

export class ExtensionGenerator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populateExtension(): void {
        if (this._hre.network.zksync) {
            const zkSyncGenerator = new ZkSyncGenerator(this._hre);
            zkSyncGenerator.populateExtension();
            return;
        }

        const ethersGenerators = new EthersGenerator(this._hre);
        ethersGenerators.populateExtension();
    }
}

interface Generator {
    populateExtension(): void;
}

class ZkSyncGenerator implements Generator {
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

class EthersGenerator implements Generator {
    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public populateExtension(): void {
        this._hre.upgrades = lazyObject(() => this.makeFunctions(false) as HardhatUpgradesOZ & HardhatZksyncUpgrades);
        this.warnOnHardhatDefender();
        this._hre.defender = lazyObject(() => this.makeDefenderFunctions());
    }

    private makeFunctions(defender: boolean): HardhatUpgradesOZ {
        const {
            getImplementationAddressFromBeacon,
            silenceWarnings,
        } = require('@openzeppelin/upgrades-core/dist/impl-address');
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
        const { makeDeployProxyAdmin } = require('@openzeppelin/hardhat-upgrades/dist/deploy-proxy-admin');
        const {
            makeChangeProxyAdmin,
            makeTransferProxyAdminOwnership,
            makeGetInstanceFunction,
        } = require('@openzeppelin/hardhat-upgrades/dist/admin');

        return {
            silenceWarnings,
            deployProxy: makeDeployProxy(this._hre, defender),
            upgradeProxy: makeUpgradeProxy(this._hre, defender), // block on defender
            validateImplementation: makeValidateImplementation(this._hre),
            validateUpgrade: makeValidateUpgrade(this._hre),
            deployImplementation: makeDeployImplementation(this._hre, defender),
            prepareUpgrade: makePrepareUpgrade(this._hre, defender),
            deployBeacon: makeDeployBeacon(this._hre, defender), // block on defender
            deployBeaconProxy: makeDeployBeaconProxy(this._hre, defender),
            deployProxyAdmin: makeDeployProxyAdmin(this._hre, defender),
            upgradeBeacon: makeUpgradeBeacon(this._hre, defender), // block on defender
            forceImport: makeForceImport(this._hre),
            admin: {
                getInstance: makeGetInstanceFunction(this._hre, defender), // block on defender
                changeProxyAdmin: makeChangeProxyAdmin(this._hre, defender), // block on defender
                transferProxyAdminOwnership: makeTransferProxyAdminOwnership(this._hre, defender), // block on defender
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
            // Properties from zksync
            estimation: {
                estimateGasProxy: makeUndefinedFunction(),
                estimateGasBeacon: makeUndefinedFunction(),
                estimateGasBeaconProxy: makeUndefinedFunction(),
            },
        };
    }

    private makeDefenderFunctions() {
        const { makeDeployContract } = require('@openzeppelin/hardhat-upgrades/dist/deploy-contract');
        const {
            makeProposeUpgradeWithApproval,
        } = require('@openzeppelin/hardhat-upgrades/dist/defender/propose-upgrade-with-approval');
        const {
            makeGetDeployApprovalProcess,
            makeGetUpgradeApprovalProcess,
        } = require('@openzeppelin/hardhat-upgrades/dist/defender/get-approval-process');

        const getUpgradeApprovalProcess = makeGetUpgradeApprovalProcess(this._hre);

        return {
            ...this.makeFunctions(true),
            // ...this.makeDefenderV1Functions(),
            deployContract: makeDeployContract(this._hre, true),
            proposeUpgradeWithApproval: makeProposeUpgradeWithApproval(this._hre, true),
            getDeployApprovalProcess: makeGetDeployApprovalProcess(this._hre),
            getUpgradeApprovalProcess,
            getDefaultApprovalProcess: getUpgradeApprovalProcess, // deprecated, is an alias for getUpgradeApprovalProcess
        };
    }

    private makeDefenderV1Functions() {
        const {
            makeVerifyDeploy,
            makeVerifyDeployWithUploadedArtifact,
            makeGetVerifyDeployBuildInfo,
            makeGetVerifyDeployArtifact,
            makeGetBytecodeDigest,
        } = require('@openzeppelin/hardhat-upgrades/dist/defender-v1/verify-deployment');
        const { makeProposeUpgrade } = require('@openzeppelin/hardhat-upgrades/dist/defender-v1/propose-upgrade');

        return {
            proposeUpgrade: makeProposeUpgrade(this._hre),
            verifyDeployment: makeVerifyDeploy(this._hre),
            verifyDeploymentWithUploadedArtifact: makeVerifyDeployWithUploadedArtifact(this._hre),
            getDeploymentArtifact: makeGetVerifyDeployArtifact(this._hre),
            getDeploymentBuildInfo: makeGetVerifyDeployBuildInfo(this._hre),
            getBytecodeDigest: makeGetBytecodeDigest(this._hre),
        };
    }

    private warnOnHardhatDefender() {
        if (tryRequire('@openzeppelin/hardhat-defender', true)) {
            const { logWarning } = require('@openzeppelin/upgrades-core');
            logWarning('The @openzeppelin/hardhat-defender package is deprecated.', [
                'Uninstall the @openzeppelin/hardhat-defender package.',
                'OpenZeppelin Defender integration is included as part of the Hardhat Upgrades plugin.',
            ]);
        }
    }
}
