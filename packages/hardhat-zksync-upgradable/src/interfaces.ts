import { SolcInput, SolcOutput } from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-web3';

import { DeployAdminFunction } from './proxy-deployment/deploy-proxy-admin';
import { UpgradeFunction } from './proxy-upgrade/upgrade-proxy';
import { DeployBeaconFunction } from './proxy-deployment/deploy-beacon';
import { DeployBeaconProxyFunction } from './proxy-deployment/deploy-beacon-proxy';
import { UpgradeBeaconFunction } from './proxy-upgrade/upgrade-beacon';
import { DeployFunction } from './proxy-deployment/deploy-proxy';
import { ValidateImplementationOptions } from './utils/options';
import { ChangeAdminFunction, GetInstanceFunction, TransferProxyAdminOwnershipFunction } from './admin';

export type ValidateImplementationFunction = (
    ImplFactory: zk.ContractFactory,
    opts?: ValidateImplementationOptions
) => Promise<void>;

export interface HardhatUpgrades {
    deployProxy: DeployFunction;
    upgradeProxy: UpgradeFunction;
    validateImplementation: ValidateImplementationFunction;
    deployBeacon: DeployBeaconFunction;
    deployBeaconProxy: DeployBeaconProxyFunction;
    upgradeBeacon: UpgradeBeaconFunction;
    deployProxyAdmin: DeployAdminFunction;
    admin: {
        getInstance: GetInstanceFunction;
        changeProxyAdmin: ChangeAdminFunction;
        transferProxyAdminOwnership: TransferProxyAdminOwnershipFunction;
    };
}

export interface RunCompilerArgs {
    input: SolcInput;
    solcVersion: string;
}

export type ContractAddressOrInstance = string | { address: string };

export type RecursivePartial<T> = { [k in keyof T]?: RecursivePartial<T[k]> };

export type MaybeSolcOutput = RecursivePartial<SolcOutput>;
