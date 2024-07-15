import { SolcInput, SolcOutput } from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-ethers';

import { DeployAdminFunction } from './proxy-deployment/deploy-proxy-admin';
import { UpgradeFunction } from './proxy-upgrade/upgrade-proxy';
import { UpgradeBeaconFunction } from './proxy-upgrade/upgrade-beacon';
import { ValidateImplementationOptions } from './utils/options';
import { ChangeAdminFunction, GetInstanceFunction, TransferProxyAdminOwnershipFunction } from './admin';
import { EstimateBeaconGasFunction } from './gas-estimation/estimate-gas-beacon-proxy';
import { EstimateProxyGasFunction } from './gas-estimation/estimate-gas-proxy';
import { DeployBeaconProxyArtifact, DeployBeaconProxyFactory } from './proxy-deployment/deploy-beacon-proxy';
import { DeployBeaconArtifact, DeployBeaconFactory } from './proxy-deployment/deploy-beacon';
import { DeployFunctionArtifact, DeployFunctionFactory } from './proxy-deployment/deploy-proxy';

export type ValidateImplementationFunction = (
    ImplFactory: zk.ContractFactory,
    opts?: ValidateImplementationOptions,
) => Promise<void>;

export interface HardhatUpgrades {
    deployProxy: DeployFunctionArtifact & DeployFunctionFactory;
    upgradeProxy: UpgradeFunction;
    validateImplementation: ValidateImplementationFunction;
    deployBeacon: DeployBeaconArtifact & DeployBeaconFactory;
    deployBeaconProxy: DeployBeaconProxyFactory & DeployBeaconProxyArtifact;
    upgradeBeacon: UpgradeBeaconFunction;
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
