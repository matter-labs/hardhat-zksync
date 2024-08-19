import { SolcInput, SolcOutput } from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-ethers';

import { DeployFunction as DeployFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-proxy';
import { UpgradeFunction as UpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/upgrade-proxy';
import { ValidateUpgradeFunction as ValidateUpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/validate-upgrade';
import { DeployImplementationFunction as DeployImplementationFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-implementation';
import { PrepareUpgradeFunction as PrepareUpgradeFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/prepare-upgrade';
import { DeployBeaconFunction as DeployBeaconFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-beacon';
import { DeployBeaconProxyFunction as DeployBeaconProxyFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-beacon-proxy';
import { UpgradeBeaconFunction as UpgradeBeaconFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/upgrade-beacon';
import { ForceImportFunction as ForceImportFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/force-import';
import { DeployContractFunction as DeployContractFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/deploy-contract';
import { GetDefaultApprovalProcessFunction as GetDefaultApprovalProcessFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/platform/get-default-approval-process';
import { ValidateImplementationFunction as ValidateImplementationFunctionOZ } from '@openzeppelin/hardhat-upgrades/dist/validate-implementation';
import { EstimateProxyGasFunction } from './gas-estimation/estimate-gas-proxy';
import { EstimateBeaconGasFunction } from './gas-estimation/estimate-gas-beacon-proxy';
import { ChangeAdminFunction, GetInstanceFunction, TransferProxyAdminOwnershipFunction } from './admin';
import { ValidateImplementationOptions } from './utils/options';
import { DeployBeaconProxyArtifact, DeployBeaconProxyFactory } from './proxy-deployment/deploy-beacon-proxy';
import { DeployBeaconArtifact, DeployBeaconFactory } from './proxy-deployment/deploy-beacon';
import {
    DeployFunctionArtifact,
    DeployFunctionFactory,
    DeployFunctionFactoryNoArgs,
} from './proxy-deployment/deploy-proxy';
import { UpgradeBeaconArtifact, UpgradeBeaconFactory } from './proxy-upgrade/upgrade-beacon';
import { UpgradeProxyArtifact, UpgradeProxyFactory } from './proxy-upgrade/upgrade-proxy';
import { DeployAdminFunction } from './proxy-deployment/deploy-proxy-admin';

export type UndefinedFunctionType = (...args: any[]) => any;

export function makeUndefinedFunction(): UndefinedFunctionType {
    return (..._: any[]) => {
        throw new Error('This function is not implemented');
    };
}

export type ValidateImplementationFunction = (
    ImplFactory: zk.ContractFactory,
    opts?: ValidateImplementationOptions,
) => Promise<void>;

export interface PlatformHardhatUpgrades extends HardhatUpgrades {
    deployContract: DeployContractFunctionOZ;
    proposeUpgrade: any;
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
    deployProxyAdmin: DeployAdminFunction;
    forceImport: ForceImportFunctionOZ;
    silenceWarnings: any;
    admin: {
        getInstance: GetInstanceFunction;
        changeProxyAdmin: ChangeAdminFunction;
        transferProxyAdminOwnership: TransferProxyAdminOwnershipFunction;
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

export interface HardhatUpgrades {
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

export type ContractAddressOrInstance = string | { address: string };

export type RecursivePartial<T> = { [k in keyof T]?: RecursivePartial<T[k]> };

export type MaybeSolcOutput = RecursivePartial<SolcOutput>;

export interface VerifiableContractInfo {
    event: string;
}
