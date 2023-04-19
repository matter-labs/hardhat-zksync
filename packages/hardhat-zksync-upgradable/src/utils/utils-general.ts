import { PROXY_ARTIFACTS_PATH } from '../constants';

import { Interface } from '@ethersproject/abi';
import { MaybeSolcOutput } from '../interfaces';

export async function importProxyContract(pathToSrc: string, compilerVersion: string, proxyName: string) {
    return await import(pathToSrc + PROXY_ARTIFACTS_PATH + 'zksolc-' + compilerVersion + '/' + proxyName);
}

export type ContractAddressOrInstance = string | { address: string };

export function getContractAddress(addressOrInstance: ContractAddressOrInstance): string {
    if (typeof addressOrInstance === 'string') {
        return addressOrInstance;
    } else {
        return addressOrInstance.address;
    }
}

export function getInitializerData(
    contractInterface: Interface,
    args: unknown[],
    initializer?: string | false
): string {
    if (initializer === false) {
        return '0x';
    }

    const allowNoInitialization = initializer === undefined && args.length === 0;
    initializer = initializer ?? 'initialize';

    try {
        const fragment = contractInterface.getFunction(initializer);
        return contractInterface.encodeFunctionData(fragment, args);
    } catch (e: unknown) {
        if (e instanceof Error) {
            if (allowNoInitialization && e.message.includes('no matching function')) {
                return '0x';
            }
        }
        throw e;
    }
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const res: Partial<Pick<T, K>> = {};
    for (const k of keys) {
        res[k] = obj[k];
    }
    return res as Pick<T, K>;
}

export function mapValues<V, W>(obj: Record<string, V>, fn: (value: V) => W): Record<string, W> {
    const res: Partial<Record<string, W>> = {};
    for (const k in obj) {
        res[k] = fn(obj[k]);
    }
    return res as Record<string, W>;
}

export function isFullZkSolcOutput(output: MaybeSolcOutput | undefined): boolean {
    if (output?.contracts == undefined || output?.sources == undefined) {
        return false;
    }

    for (const fileName of Object.keys(output.contracts)) {
        const file = output.contracts[fileName];
        if (file == undefined) {
            return false;
        }
    }

    for (const file of Object.values(output.sources)) {
        if (file?.ast == undefined || file?.id == undefined) {
            return false;
        }
    }

    return true;
}
