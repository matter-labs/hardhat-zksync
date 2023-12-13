import * as zk from 'zksync-ethers';
import {
    DeployOpts,
    ProxyKindOption,
    StandaloneValidationOptions,
    ValidationOptions,
    withValidationDefaults,
} from '@openzeppelin/upgrades-core';

import { LOCAL_SETUP_ZKSYNC_NETWORK } from '../constants';

export type StandaloneOptions = StandaloneValidationOptions &
    DeployOpts & {
        constructorArgs?: unknown[];
        useDeployedImplementation?: boolean;
        provider?: any;
    };

export type UpgradeOptions = ValidationOptions & StandaloneOptions;

export function withDefaults(opts: UpgradeOptions = {}): Required<UpgradeOptions> {
    return {
        constructorArgs: opts.constructorArgs ?? [],
        timeout: opts.timeout ?? 60e3,
        provider: opts.provider ?? new zk.Provider(LOCAL_SETUP_ZKSYNC_NETWORK),
        pollingInterval: opts.pollingInterval ?? 5e3,
        useDeployedImplementation: opts.useDeployedImplementation ?? true,
        ...withValidationDefaults(opts),
    };
}

type Initializer = {
    initializer?: string | false;
};

export type DeployBeaconProxyOptions = ProxyKindOption & Initializer;
export type DeployBeaconOptions = StandaloneOptions;
export type DeployImplementationOptions = StandaloneOptions;
export type DeployProxyAdminOptions = DeployOpts;
export type DeployProxyOptions = StandaloneOptions & Initializer;
export type UpgradeBeaconOptions = UpgradeOptions;
export type UpgradeProxyOptions = UpgradeOptions & {
    call?: { fn: string; args?: unknown[] } | string;
};
export type ValidateImplementationOptions = StandaloneValidationOptions;
