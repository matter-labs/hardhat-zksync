import { HardhatNetworkHDAccountsConfig } from 'hardhat/types';
import { FactoryOptions, ZkSyncArtifact } from './types';
import { Wallet } from 'zksync2-js';

export function isHardhatNetworkHDAccountsConfig(object: any): object is HardhatNetworkHDAccountsConfig {
    return 'mnemonic' in object;
}

export function isHardhatNetworkAccountsConfigStrings(object: any): object is string[] {
    return typeof object[0] === 'string';
}

export function isString(object: any): object is string {
    return typeof object === 'string';
}

export function isNumber(object: any): object is number {
    return typeof object === 'number';
}

export function isFactoryOptions(walletOrOptions?: Wallet | FactoryOptions): walletOrOptions is FactoryOptions {
    if (walletOrOptions === undefined || 'provider' in walletOrOptions) {
        return false;
    }

    return true;
}

export function isArtifact(artifact: any): artifact is ZkSyncArtifact {
    const {
        contractName,
        sourceName,
        abi,
        bytecode,
        deployedBytecode,
        linkReferences,
        deployedLinkReferences,
        factoryDeps,
    } = artifact;

    return (
        typeof contractName === 'string' &&
        typeof sourceName === 'string' &&
        Array.isArray(abi) &&
        typeof bytecode === 'string' &&
        typeof deployedBytecode === 'string' &&
        linkReferences !== undefined &&
        deployedLinkReferences !== undefined &&
        factoryDeps !== undefined
    );
}
