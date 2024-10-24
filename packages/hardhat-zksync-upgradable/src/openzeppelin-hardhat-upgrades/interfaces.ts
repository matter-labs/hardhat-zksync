import { silenceWarnings } from '@openzeppelin/upgrades-core';

import { DeployFunction as DeployFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-proxy';
import { PrepareUpgradeFunction as PrepareUpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/prepare-upgrade';
import { UpgradeFunction as UpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/upgrade-proxy';
import { DeployBeaconFunction as DeployBeaconFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-beacon';
import { DeployBeaconProxyFunction as DeployBeaconProxyFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-beacon-proxy';
import { UpgradeBeaconFunction as UpgradeBeaconFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/upgrade-beacon';
import { ForceImportFunction as ForceImportFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/force-import';
import {
    ChangeAdminFunction as ChangeAdminFunctionOZ,
    TransferProxyAdminOwnershipFunction as TransferProxyAdminOwnershipFunctionOZ,
} from '@openzeppelin/hardhat-upgrades/dist/admin';
import { ValidateImplementationFunction as ValidateImplementationFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/validate-implementation';
import { ValidateUpgradeFunction as ValidateUpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/validate-upgrade';
import { DeployImplementationFunction as DeployImplementationFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-implementation';
import { DeployContractFunction as DeployContractFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-contract';
import {
    GetDeployApprovalProcessFunction as GetDeployApprovalProcessFunctionOZ,
    GetUpgradeApprovalProcessFunction as GetUpgradeApprovalProcessFunctionOZ,
} from '@openzeppelin/hardhat-upgrades/dist/defender/get-approval-process';

import { UndefinedFunctionType } from '../utils';

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
    forceImport: ForceImportFunctionOZ;
    silenceWarnings: typeof silenceWarnings;
    admin: {
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
    // Properties from zksync
    estimation: {
        estimateGasProxy: UndefinedFunctionType;
        estimateGasBeacon: UndefinedFunctionType;
        estimateGasBeaconProxy: UndefinedFunctionType;
    };
}

export type DefenderHardhatUpgradesOZ = {
    deployContract: DeployContractFunctionOZ;
    proposeUpgradeWithApproval: any;
    getDeployApprovalProcess: GetDeployApprovalProcessFunctionOZ;
    getUpgradeApprovalProcess: GetUpgradeApprovalProcessFunctionOZ;
    /**
     * @deprecated Use `getUpgradeApprovalProcess` instead.
     */
    getDefaultApprovalProcess: GetUpgradeApprovalProcessFunctionOZ;
} & HardhatUpgradesOZ;
