import { silenceWarnings, SolcInput, SolcOutput } from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-ethers';

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
    GetInstanceFunction as GetInstanceFunctionOZ,
} from '@openzeppelin/hardhat-upgrades/dist/admin';
import { ValidateImplementationFunction as ValidateImplementationFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/validate-implementation';
import { ValidateUpgradeFunction as ValidateUpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/validate-upgrade';
import { DeployImplementationFunction as DeployImplementationFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-implementation';
import { DeployContractFunction as DeployContractFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-contract';
import {
    GetDeployApprovalProcessFunction as GetDeployApprovalProcessFunctionOZ,
    GetUpgradeApprovalProcessFunction as GetUpgradeApprovalProcessFunctionOZ,
} from '@openzeppelin/hardhat-upgrades/dist/defender/get-approval-process';

//   import type { ProposeUpgradeFunction as  ProposeUpgradeFunctionOZ} from '@openzeppelin/hardhat-upgrades/dist/defender-v1/propose-upgrade';
//   import type {
//     VerifyDeployFunction as VerifyDeployFunctionOZ,
//     VerifyDeployWithUploadedArtifactFunction as VerifyDeployWithUploadedArtifactFunctionOZ,
//     GetVerifyDeployArtifactFunction as GetVerifyDeployArtifactFunctionOZ,
//     GetVerifyDeployBuildInfoFunction as GetVerifyDeployBuildInfoFunctionOZ,
//     GetBytecodeDigestFunction as GetBytecodeDigestFunctionOZ,
//   } from '@openzeppelin/hardhat-upgrades/dist/defender-v1/verify-deployment';

import { UpgradeProxyArtifact, UpgradeProxyFactory } from './proxy-upgrade/upgrade-proxy';
import { UpgradeBeaconArtifact, UpgradeBeaconFactory } from './proxy-upgrade/upgrade-beacon';
import {
    DeployFunctionArtifact,
    DeployFunctionFactory,
    DeployFunctionFactoryNoArgs,
} from './proxy-deployment/deploy-proxy';
import { DeployBeaconArtifact, DeployBeaconFactory } from './proxy-deployment/deploy-beacon';
import { DeployBeaconProxyArtifact, DeployBeaconProxyFactory } from './proxy-deployment/deploy-beacon-proxy';
import { EstimateProxyGasFunction } from './gas-estimation/estimate-gas-proxy';
import { EstimateBeaconGasFunction } from './gas-estimation/estimate-gas-beacon-proxy';
import { ChangeAdminFunction, GetInstanceFunction, TransferProxyAdminOwnershipFunction } from './admin';
import { ValidateImplementationOptions } from './utils/options';
import { DeployAdminFunction } from './proxy-deployment/deploy-proxy-admin';

export type UndefinedFunctionType = (...args: any[]) => any;

export function makeUndefinedFunction(): UndefinedFunctionType {
    return (..._: any[]) => {
        throw new Error('This function is not implemented');
    };
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
    forceImport: ForceImportFunctionOZ;
    silenceWarnings: typeof silenceWarnings;
    admin: {
        // property from zksync
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
    // Properties from zksync
    deployProxyAdmin: UndefinedFunctionType;
    estimation: {
        estimateGasProxy: UndefinedFunctionType;
        estimateGasBeacon: UndefinedFunctionType;
        estimateGasBeaconProxy: UndefinedFunctionType;
    };
}

// export type DefenderV1HardhatUpgradesOZ = {
//     proposeUpgrade: ProposeUpgradeFunctionOZ;
//     verifyDeployment: VerifyDeployFunctionOZ;
//     verifyDeploymentWithUploadedArtifact: VerifyDeployWithUploadedArtifactFunctionOZ;
//     getDeploymentArtifact: GetVerifyDeployArtifactFunctionOZ;
//     getDeploymentBuildInfo: GetVerifyDeployBuildInfoFunctionOZ;
//     getBytecodeDigest: GetBytecodeDigestFunctionOZ;
//   }

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

export type ValidateImplementationFunction = (
    ImplFactory: zk.ContractFactory,
    opts?: ValidateImplementationOptions,
) => Promise<void>;

export interface HardhatZksyncUpgrades {
    deployProxy: DeployFunctionArtifact & DeployFunctionFactory & DeployFunctionFactoryNoArgs;
    upgradeProxy: UpgradeProxyFactory & UpgradeProxyArtifact;
    validateImplementation: ValidateImplementationFunction;
    deployBeacon: DeployBeaconArtifact & DeployBeaconFactory;
    deployBeaconProxy: DeployBeaconProxyFactory & DeployBeaconProxyArtifact;
    upgradeBeacon: UpgradeBeaconFactory & UpgradeBeaconArtifact;
    deployProxyAdmin: DeployAdminFunction;
    admin: {
        getInstance: GetInstanceFunction;
        changeProxyAdmin: ChangeAdminFunction;
        transferProxyAdminOwnership: TransferProxyAdminOwnershipFunction;
    };
    estimation: {
        estimateGasProxy: EstimateProxyGasFunction;
        estimateGasBeacon: EstimateProxyGasFunction;
        estimateGasBeaconProxy: EstimateBeaconGasFunction;
    };
    // Properties from oz-upgrades
    forceImport: UndefinedFunctionType;
    silenceWarnings: UndefinedFunctionType;
    validateUpgrade: UndefinedFunctionType;
    deployImplementation: UndefinedFunctionType;
    prepareUpgrade: UndefinedFunctionType;
    beacon: {
        getImplementationAddress: UndefinedFunctionType;
    };
    erc1967: {
        getAdminAddress: UndefinedFunctionType;
        getImplementationAddress: UndefinedFunctionType;
        getBeaconAddress: UndefinedFunctionType;
    };
}

export interface RunCompilerArgs {
    input: SolcInput;
    solcVersion: string;
}

export type ContractAddressOrInstance = string | { getAddress(): Promise<string> };

export type RecursivePartial<T> = { [k in keyof T]?: RecursivePartial<T[k]> };

export type MaybeSolcOutput = RecursivePartial<SolcOutput>;

export interface VerifiableContractInfo {
    event: string;
}
