import * as zk from 'zksync-ethers';
import {
    DeployOpts,
    ProxyKindOption,
    StandaloneValidationOptions,
    ValidationOptions,
    withValidationDefaults,
} from '@openzeppelin/upgrades-core';

import { DeploymentType } from 'zksync-ethers/build/types';
import { LOCAL_SETUP_ZKSYNC_NETWORK } from '../constants';

export type StandaloneOptions<TRequiredSeperateForProxy extends boolean | undefined = true | undefined> =
    StandaloneValidationOptions &
        DeployOpts & {
            constructorArgs?: unknown[];
            useDeployedImplementation?: boolean;
            provider?: any;
            factoryDeps?: string[];
        } & DeploymentTypesOptions<TRequiredSeperateForProxy>;

export type DeploymentTypesOptions<TRequiredSeperateForProxy extends boolean | undefined = true | undefined> =
    TRequiredSeperateForProxy extends true | undefined
        ? {
              deploymentTypeImpl?: DeploymentType;
              deploymentTypeProxy?: DeploymentType;
              saltImpl?: string;
              saltProxy?: string;
          }
        : {
              deploymentType?: DeploymentType;
              salt?: string;
          };

export type UpgradeOptions<TRequiredSeperateForProxy extends boolean | undefined = true | undefined> =
    ValidationOptions & StandaloneOptions<TRequiredSeperateForProxy>;

export function withDefaults<TRequiredSeperateForProxy extends boolean | undefined = true | undefined>(
    opts: UpgradeOptions<TRequiredSeperateForProxy> = {},
): Required<UpgradeOptions<TRequiredSeperateForProxy>> {
    return {
        constructorArgs: opts.constructorArgs ?? [],
        timeout: opts.timeout ?? 60e3,
        provider: opts.provider ?? new zk.Provider(LOCAL_SETUP_ZKSYNC_NETWORK),
        pollingInterval: opts.pollingInterval ?? 5e3,
        useDeployedImplementation: opts.useDeployedImplementation ?? true,
        factoryDeps: opts.factoryDeps ?? [],
        ...withValidationDefaults(opts),
    } as Required<UpgradeOptions<TRequiredSeperateForProxy>>;
}

interface Initializer {
    initializer?: string | false;
}

export type DeployBeaconProxyOptions = ProxyKindOption & Initializer & DeploymentTypesOptions<false>;
export type DeployBeaconOptions = StandaloneOptions<false>;
export type DeployImplementationOptions = StandaloneOptions;
export type DeployProxyAdminOptions = DeployOpts;
export type DeployProxyOptions = StandaloneOptions & Initializer;
export type UpgradeBeaconOptions = UpgradeOptions<false>;
export type UpgradeProxyOptions = UpgradeOptions<false> & {
    call?: { fn: string; args?: unknown[] } | string;
};
export type ValidateImplementationOptions = StandaloneValidationOptions;
