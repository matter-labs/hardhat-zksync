import { keccak256 } from 'ethereumjs-util';
import { Interface, ethers } from 'ethers';
import chalk from 'chalk';
import * as zk from 'zksync-ethers';
import { HardhatRuntimeEnvironment, SolcConfig } from 'hardhat/types';
import { UpgradesError } from '@openzeppelin/upgrades-core';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import {
    TOPIC_LOGS_NOT_FOUND_ERROR,
    ZKSOLC_ARTIFACT_FORMAT_VERSION,
    ZKVYPER_ARTIFACT_FORMAT_VERSION,
} from '../constants';
import { MaybeSolcOutput } from '../interfaces';
import { ZkSyncUpgradablePluginError } from '../errors';

export type ContractAddressOrInstance = string | { getAddress(): Promise<string> };

export async function getContractAddress(addressOrInstance: ContractAddressOrInstance): Promise<string> {
    if (typeof addressOrInstance === 'string') {
        return addressOrInstance;
    } else {
        return await addressOrInstance.getAddress();
    }
}

export function getInitializerData(
    contractInterface: Interface,
    args: unknown[],
    initializer?: string | false,
): string {
    if (initializer === false) {
        return '0x';
    }

    const allowNoInitialization = initializer === undefined && args.length === 0;
    initializer = initializer ?? 'initialize';

    const fragment = contractInterface.getFunction(initializer);
    if (fragment === null) {
        if (allowNoInitialization) {
            return '0x';
        } else {
            throw new UpgradesError(
                `The contract has no initializer function matching the name or signature: ${initializer}`,
                () =>
                    `Ensure that the initializer function exists, specify an existing function with the 'initializer' option, or set the 'initializer' option to false to omit the initializer call.`,
            );
        }
    } else {
        return contractInterface.encodeFunctionData(fragment, args);
    }
}

/**
 * Gets the constructor args from the given transaction input and creation code.
 *
 * @param txInput The transaction input that was used to deploy the contract.
 * @param creationCode The contract creation code.
 * @returns the encoded constructor args, or undefined if txInput does not start with the creationCode.
 */
export function inferConstructorArgs(txInput: string, creationCode: string) {
    return txInput.startsWith(creationCode) ? txInput.substring(creationCode.length) : undefined;
}

/**
 * Gets the txhash that created the contract at the given address, by calling the
 * RPC API to look for an event that should have been emitted during construction.
 *
 * @param provider The provider to use to call the RPC API.
 * @param address The address to get the creation txhash for.
 * @param topic The event topic string that should have been logged.
 * @returns The txhash corresponding to the logged event, or undefined if not found or if
 *   the address is not a contract.
 */
export async function getContractCreationTxHash(provider: zk.Provider, address: string, topic: string): Promise<any> {
    const params = {
        fromBlock: 'earliest',
        toBlock: 'latest',
        address,
        topics: [`0x${keccak256(Buffer.from(topic)).toString('hex')}`],
    };

    const logs = await provider.getLogs(params);

    if (logs.length > 0) {
        return logs[0].transactionHash; // get the txhash from the first instance of this event
    } else {
        console.warn(chalk.yellow(TOPIC_LOGS_NOT_FOUND_ERROR(topic, address)));
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
        if (!k) continue;
        res[k] = fn(obj[k]);
    }
    return res as Record<string, W>;
}

export function isFullZkSolcOutput(output: MaybeSolcOutput | undefined): boolean {
    if (output?.contracts === undefined || output?.sources === undefined) {
        return false;
    }

    for (const fileName of Object.keys(output.contracts)) {
        const file = output.contracts[fileName];
        if (file === undefined) {
            return false;
        }
    }

    for (const file of Object.values(output.sources)) {
        if (file?.ast === undefined || file?.id === undefined) {
            return false;
        }
    }

    return true;
}

export function isNullish(value: unknown): value is null | undefined {
    return value === null || value === undefined;
}

export function extendCompilerOutputSelection(compiler: SolcConfig) {
    if (!compiler.settings.outputSelection['*']['*'].find((o: string) => o === 'storageLayout')) {
        compiler.settings.outputSelection['*']['*'].push('storageLayout');
    }
}

export function convertGasPriceToEth(gasPrice: bigint): string {
    return ethers.formatEther(gasPrice.toString());
}

export async function loadArtifact(
    hre: HardhatRuntimeEnvironment,
    contractNameOrFullyQualifiedName: string,
): Promise<ZkSyncArtifact> {
    const artifact = await hre.artifacts.readArtifact(contractNameOrFullyQualifiedName);

    // Verify that this artifact was compiled by the ZKsync compiler, and not `solc` or `vyper`.
    if (artifact._format !== ZKSOLC_ARTIFACT_FORMAT_VERSION && artifact._format !== ZKVYPER_ARTIFACT_FORMAT_VERSION) {
        throw new ZkSyncUpgradablePluginError(
            `Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc or zkvyper`,
        );
    }
    return artifact as ZkSyncArtifact;
}

export async function extractFactoryDeps(hre: HardhatRuntimeEnvironment, artifact: ZkSyncArtifact): Promise<string[]> {
    const visited = new Set<string>();
    visited.add(`${artifact.sourceName}:${artifact.contractName}`);
    return await extractFactoryDepsRecursive(hre, artifact, visited);
}

export async function extractFactoryDepsRecursive(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    visited: Set<string>,
): Promise<string[]> {
    // Load all the dependency bytecodes.
    // We transform it into an array of bytecodes.
    const factoryDeps: string[] = [];
    for (const dependencyHash in artifact.factoryDeps) {
        if (!dependencyHash) continue;
        const dependencyContract = artifact.factoryDeps[dependencyHash];
        if (!visited.has(dependencyContract)) {
            const dependencyArtifact = await loadArtifact(hre, dependencyContract);
            factoryDeps.push(dependencyArtifact.bytecode);
            visited.add(dependencyContract);
            const transitiveDeps = await extractFactoryDepsRecursive(hre, dependencyArtifact, visited);
            factoryDeps.push(...transitiveDeps);
        }
    }

    return factoryDeps;
}

export async function getArtifactFromBytecode(
    hre: HardhatRuntimeEnvironment,
    bytecode: string,
): Promise<ZkSyncArtifact> {
    const names = await hre.artifacts.getAllFullyQualifiedNames();
    for (const name of names) {
        const artifact = await hre.artifacts.readArtifact(name);
        if (artifact.bytecode === bytecode) {
            return artifact as ZkSyncArtifact;
        }
    }
    throw new ZkSyncUpgradablePluginError('Artifact for provided bytecode is not found.');
}
