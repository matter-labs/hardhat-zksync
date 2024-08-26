import { DeployFunction as DeployFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-proxy';
import { UpgradeFunction as UpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/upgrade-proxy';
import { ValidateUpgradeFunction as ValidateUpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/validate-upgrade';
import { DeployImplementationFunction as DeployImplementationFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-implementation';
import { PrepareUpgradeFunction as PrepareUpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/prepare-upgrade';
import { DeployBeaconFunction as DeployBeaconFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-beacon';
import { DeployBeaconProxyFunction as DeployBeaconProxyFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-beacon-proxy';
import { UpgradeBeaconFunction as UpgradeBeaconFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/upgrade-beacon';
import { ForceImportFunction as ForceImportFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/force-import';
import {
    GetInstanceFunction as GetInstanceFunctionOZ,
    ChangeAdminFunction as ChangeAdminFunctionOZ,
    TransferProxyAdminOwnershipFunction as TransferProxyAdminOwnershipFunctionOZ,
} from '@openzeppelin/hardhat-upgrades/dist/admin';
import { DeployContractFunction as DeployContractFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-contract';
import { GetDefaultApprovalProcessFunction as GetDefaultApprovalProcessFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/platform/get-default-approval-process';
import { ValidateImplementationFunction as ValidateImplementationFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/validate-implementation';
import { silenceWarnings } from '@openzeppelin/upgrades-core';
import { DeployAdminFunction as DeployAdminFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-proxy-admin';
import { ProposeUpgradeFunction as ProposeUpgradeFunctionOZ } from './platform/propose-upgrade';

export interface PlatformHardhatUpgradesOZ extends HardhatUpgradesOZ {
    deployContract: DeployContractFunctionOZ;
    proposeUpgrade: ProposeUpgradeFunctionOZ;
    getDefaultApprovalProcess: GetDefaultApprovalProcessFunctionOZ;
}

export interface HardhatUpgradesOZ {
    deployProxy: DeployFunctionOZ;
    upgradeProxy: UpgradeFunctionOZ;
    validateImplementation: ValidateImplementationFunctionOZ;
    validateUpgrade: ValidateUpgradeFunctionOZ;
    deployImplementation: DeployImplementationFunctionOZ;
    prepareUpgrade: PrepareUpgradeFunctionOZ;
    deployBeacon: DeployBeaconFunctionOZ;
    deployBeaconProxy: DeployBeaconProxyFunctionOZ;
    upgradeBeacon: UpgradeBeaconFunctionOZ;
    deployProxyAdmin: DeployAdminFunctionOZ;
    forceImport: ForceImportFunctionOZ;
    silenceWarnings: typeof silenceWarnings;
    admin: {
        getInstance: GetInstanceFunctionOZ;
        changeProxyAdmin: ChangeAdminFunctionOZ;
        transferProxyAdminOwnership: TransferProxyAdminOwnershipFunctionOZ;
    };
    erc1967: {
        getAdminAddress: (proxyAdress: string) => Promise<string>;
        getImplementationAddress: (proxyAdress: string) => Promise<string>;
        getBeaconAddress: (proxyAdress: string) => Promise<string>;
    };
    beacon: {
        getImplementationAddress: (beaconAddress: string) => Promise<string>;
    };
}

export interface HardhatPlatformConfig {
    apiKey: string;
    apiSecret: string;
    usePlatformDeploy?: boolean;
}
