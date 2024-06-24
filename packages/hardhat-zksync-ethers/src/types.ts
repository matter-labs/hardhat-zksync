import type * as ethers from 'ethers';
import type { Artifact } from 'hardhat/types';
import { Contract, ContractFactory, Provider, Signer, Wallet } from 'zksync-ethers';
import { Address, DeploymentType } from 'zksync-ethers/build/types';

export type EthNetwork = string;

export interface FactoryDeps {
    // A mapping from the contract hash to the contract bytecode.
    [contractHash: string]: string;
}

export interface ZkSyncArtifact extends Artifact {
    // List of factory dependencies of a contract.
    factoryDeps: FactoryDeps;
    // Mapping from the bytecode to the zkEVM assembly (used for tracing).
    sourceMapping: string;
}

export interface FactoryOptions {
    wallet?: Wallet;
}

export declare function getContractFactory<A extends any[] = any[], I = Contract>(
    name: string,
    wallet?: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<A, I>>;

export declare function getContractFactory<A extends any[] = any[], I = Contract>(
    abi: any[],
    bytecode: ethers.BytesLike,
    wallet?: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<A, I>>;

export declare function getContractFactoryFromArtifact<A extends any[] = any[], I = Contract>(
    artifact: ZkSyncArtifact,
    wallet?: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<A, I>>;

export interface HardhatZksyncEthersHelpers {
    providerL1: ethers.Provider;
    providerL2: Provider;
    getWallets: () => Promise<Wallet[]>;
    getWallet: (privateKeyOrIndex?: string | number) => Promise<Wallet>;
    getContractFactory: typeof getContractFactory;
    getContractFactoryFromArtifact: typeof getContractFactoryFromArtifact;
    getContractAt: (nameOrAbi: string | any[], address: string | Address, wallet?: Wallet) => Promise<Contract>;
    getContractAtFromArtifact: (artifact: ZkSyncArtifact, address: string, wallet?: Wallet) => Promise<Contract>;
    getImpersonatedSigner: (address: string) => Promise<Signer>;
    extractFactoryDeps: (artifact: ZkSyncArtifact) => Promise<string[]>;
    loadArtifact: (name: string) => Promise<ZkSyncArtifact>;
    deployContract: (
        artifact: ZkSyncArtifact,
        constructorArguments: any[],
        wallet?: Wallet,
        overrides?: ethers.Overrides,
        additionalFactoryDeps?: ethers.BytesLike[],
    ) => Promise<Contract>;
}
