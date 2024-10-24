import { SolcInput, SolcOutput } from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-ethers';

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
import { ChangeAdminFunction, TransferProxyAdminOwnershipFunction } from './admin';
import { ValidateImplementationOptions } from './utils/options';
import { UndefinedFunctionType } from './utils';

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
    admin: {
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
