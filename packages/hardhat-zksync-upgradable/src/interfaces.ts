import { SolcInput, SolcOutput } from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-ethers';

import { DeployFunction as _DeployFunction } from '@openzeppelin/hardhat-upgrades/dist/deploy-proxy';
import { PrepareUpgradeFunction } from '@openzeppelin/hardhat-upgrades/dist/prepare-upgrade';
import { UpgradeFunction } from '@openzeppelin/hardhat-upgrades/dist/upgrade-proxy';
import { DeployBeaconFunction } from '@openzeppelin/hardhat-upgrades/dist/deploy-beacon';
import { DeployBeaconProxyFunction } from '@openzeppelin/hardhat-upgrades/dist/deploy-beacon-proxy';
import { UpgradeBeaconFunction } from '@openzeppelin/hardhat-upgrades/dist/upgrade-beacon';
import { ForceImportFunction } from '@openzeppelin/hardhat-upgrades/dist/force-import';
import {
    ChangeAdminFunction as _ChangeAdminFunction,
    TransferProxyAdminOwnershipFunction as _TransferProxyAdminOwnershipFunction,
} from '@openzeppelin/hardhat-upgrades/dist/admin';
import { ValidateImplementationFunction as _ValidateImplementationFunction } from '@openzeppelin/hardhat-upgrades/dist/validate-implementation';
import { ValidateUpgradeFunction } from '@openzeppelin/hardhat-upgrades/dist/validate-upgrade';
import { DeployImplementationFunction } from '@openzeppelin/hardhat-upgrades/dist/deploy-implementation';
import { DeployContractFunction } from '@openzeppelin/hardhat-upgrades/dist/deploy-contract';
// import { ProposeUpgradeWithApprovalFunction } from '@openzeppelin/hardhat-upgrades/dist/defender/propose-upgrade-with-approval';
import {
    GetDeployApprovalProcessFunction,
    GetUpgradeApprovalProcessFunction,
} from '@openzeppelin/hardhat-upgrades/dist/defender/get-approval-process';
import { UpgradeProxyArtifact, UpgradeProxyFactory } from './proxy-upgrade/upgrade-proxy';
import { UpgradeBeaconArtifact, UpgradeBeaconFactory } from './proxy-upgrade/upgrade-beacon';
import { DeployFunctionArtifact, DeployFunctionFactory } from './proxy-deployment/deploy-proxy';
import { DeployBeaconArtifact, DeployBeaconFactory } from './proxy-deployment/deploy-beacon';
import { DeployBeaconProxyArtifact, DeployBeaconProxyFactory } from './proxy-deployment/deploy-beacon-proxy';
import { EstimateProxyGasFunction } from './gas-estimation/estimate-gas-proxy';
import { EstimateBeaconGasFunction } from './gas-estimation/estimate-gas-beacon-proxy';
import { ChangeAdminFunction, GetInstanceFunction, TransferProxyAdminOwnershipFunction } from './admin';
import { ValidateImplementationOptions } from './utils/options';
import { DeployAdminFunction } from './proxy-deployment/deploy-proxy-admin';

export interface HardhatUpgrades {
    deployProxy: _DeployFunction;
    upgradeProxy: UpgradeFunction;
    validateImplementation: _ValidateImplementationFunction;
    validateUpgrade: ValidateUpgradeFunction;
    deployImplementation: DeployImplementationFunction;
    prepareUpgrade: PrepareUpgradeFunction;
    deployBeacon: DeployBeaconFunction;
    deployBeaconProxy: DeployBeaconProxyFunction;
    upgradeBeacon: UpgradeBeaconFunction;
    forceImport: ForceImportFunction;
    // silenceWarnings: typeof silenceWarnings;
    silenceWarnings: any;
    admin: {
        changeProxyAdmin: _ChangeAdminFunction;
        transferProxyAdminOwnership: _TransferProxyAdminOwnershipFunction;
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

export type DefenderHardhatUpgrades = {
    deployContract: DeployContractFunction;
    proposeUpgradeWithApproval: any;
    getDeployApprovalProcess: GetDeployApprovalProcessFunction;
    getUpgradeApprovalProcess: GetUpgradeApprovalProcessFunction;
    /**
     * @deprecated Use `getUpgradeApprovalProcess` instead.
     */
    getDefaultApprovalProcess: GetUpgradeApprovalProcessFunction;
} & HardhatUpgrades;

export type ValidateImplementationFunction = (
    ImplFactory: zk.ContractFactory,
    opts?: ValidateImplementationOptions,
) => Promise<void>;

export interface HardhatZksyncUpgrades {
    deployProxy: DeployFunctionArtifact & DeployFunctionFactory;
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
