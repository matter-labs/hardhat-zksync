import { silenceWarnings } from '@openzeppelin/upgrades-core';
import type { PrepareUpgradeFunction } from '@openzeppelin/hardhat-upgrades/src/prepare-upgrade';
// import type { DeployBeaconFunction } from '@openzeppelin/hardhat-upgrades/src/deploy-beacon';
// import type { DeployBeaconProxyFunction } from '@openzeppelin/hardhat-upgrades/src/deploy-beacon-proxy';
// import type { UpgradeBeaconFunction } from '@openzeppelin/hardhat-upgrades/src/upgrade-beacon';
import type { ForceImportFunction } from '@openzeppelin/hardhat-upgrades/src/force-import';
import type {
    ChangeAdminFunction,
    TransferProxyAdminOwnershipFunction,
    GetInstanceFunction,
} from '@openzeppelin/hardhat-upgrades/src/admin';
import type { ValidateImplementationFunction } from '@openzeppelin/hardhat-upgrades/src/validate-implementation';
import type { ValidateUpgradeFunction } from '@openzeppelin/hardhat-upgrades/src/validate-upgrade';
import type { DeployImplementationFunction } from '@openzeppelin/hardhat-upgrades/src/deploy-implementation';
// import { DeployFunction } from './deploy-proxy-admin';

import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/src/utils';
import type { ContractFactory, Contract } from 'ethers';
import { DeployAdminFunction } from './deploy-proxy-admin';
import { UpgradeFunction } from './upgrade-proxy';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { DeployBeaconFunction } from './deploy-beacon';
import { DeployBeaconProxyFunction } from './deploy-beacon-proxy';
import { UpgradeBeaconFunction } from './upgrade-beacon';

export interface DeployFunction {
    (deployer: Deployer, ImplFactory: any, args?: unknown[], opts?: DeployProxyOptions): Promise<Contract>;
    (deployer: Deployer, ImplFactory: ContractFactory, opts?: DeployProxyOptions): Promise<Contract>;
}

export interface Zgadija {
    name: string;
    version: string;
}

export interface HardhatUpgrades {
    deployProxy: DeployFunction;
    upgradeProxy: UpgradeFunction;
    // validateImplementation: ValidateImplementationFunction;
    // validateUpgrade: ValidateUpgradeFunction;
    // deployImplementation: DeployImplementationFunction;
    // prepareUpgrade: PrepareUpgradeFunction;
    deployBeacon: DeployBeaconFunction;
    deployBeaconProxy: DeployBeaconProxyFunction;
    upgradeBeacon: UpgradeBeaconFunction;
    deployProxyAdmin: DeployAdminFunction;
    // forceImport: ForceImportFunction;
    // silenceWarnings: typeof silenceWarnings;
    // admin: {
    //     getInstance: GetInstanceFunction;
    //     changeProxyAdmin: ChangeAdminFunction;
    //     transferProxyAdminOwnership: TransferProxyAdminOwnershipFunction;
    // };
    // erc1967: {
    //     getAdminAddress: (proxyAdress: string) => Promise<string>;
    //     getImplementationAddress: (proxyAdress: string) => Promise<string>;
    //     getBeaconAddress: (proxyAdress: string) => Promise<string>;
    // };
    // beacon: {
    //     getImplementationAddress: (beaconAddress: string) => Promise<string>;
    // };
}

export type ContractAddressOrInstance = string | { address: string };
