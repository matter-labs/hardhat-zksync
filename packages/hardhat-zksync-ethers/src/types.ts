import type * as ethers from 'ethers';
import type { Artifact } from 'hardhat/types';
import { Contract, ContractFactory, Provider, Wallet } from 'zksync-ethers';
import { Address, DeploymentType } from 'zksync-ethers/build/types';
import { HardhatZksyncSigner } from './signers/hardhat-zksync-signer';

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

export interface ZkFactoryOptions {
    wallet?: Wallet;
    signer?: HardhatZksyncSigner;
}

export type HardhatZksyncSignerOrWallet = Wallet | HardhatZksyncSigner;
export type HardhatZksyncSignerOrWalletOrFactoryOptions = HardhatZksyncSignerOrWallet | ZkFactoryOptions;

export type GetContractFactoryArtifactName<A extends any[] = any[], I = Contract> = (
    name: string,
    walletOrSigner?: HardhatZksyncSignerOrWalletOrFactoryOptions,
    deploymentType?: DeploymentType,
) => Promise<ContractFactory<A, I>>;

export type GetContractFactoryAbiBytecode<A extends any[] = any[], I = Contract> = (
    abi: any[],
    bytecode: ethers.BytesLike,
    walletOrSigner?: HardhatZksyncSignerOrWalletOrFactoryOptions,
    deploymentType?: DeploymentType,
) => Promise<ContractFactory<A, I>>;

export type GetContractFactoryArtifact<A extends any[] = any[], I = Contract> = (
    artifact: ZkSyncArtifact,
    walletOrSigner?: HardhatZksyncSignerOrWalletOrFactoryOptions,
    deploymentType?: DeploymentType,
) => Promise<ContractFactory<A, I>>;

export type GetContractFactory =
    | GetContractFactoryArtifactName
    | GetContractFactoryAbiBytecode
    | GetContractFactoryArtifact;

export declare function getContractFactory<A extends any[] = any[], I = Contract>(
    ...args: Parameters<GetContractFactoryArtifactName>
): Promise<ContractFactory<A, I>>;

export declare function getContractFactory<A extends any[] = any[], I = Contract>(
    ...args: Parameters<GetContractFactoryAbiBytecode>
): Promise<ContractFactory<A, I>>;

export declare function getContractFactoryFromArtifact<A extends any[] = any[], I = Contract>(
    ...args: Parameters<GetContractFactoryArtifact>
): Promise<ContractFactory<A, I>>;

export type GetContractAtFromName = (
    name: string,
    address: string | Address,
    walletOrSigner?: HardhatZksyncSignerOrWallet,
) => Promise<Contract>;

export type GetContractAtFromAbi = (
    abi: any[],
    address: string | Address,
    walletOrSigner?: HardhatZksyncSignerOrWallet,
) => Promise<Contract>;

export type GetContractAtFromArtifact = (
    artifact: ZkSyncArtifact,
    address: string | Address,
    walletOrSigner?: HardhatZksyncSignerOrWallet,
) => Promise<Contract>;

export type GetContractAt = GetContractAtFromName | GetContractAtFromAbi | GetContractAtFromArtifact;

export declare function getContractAt(...args: Parameters<GetContractAtFromName>): Promise<Contract>;

export declare function getContractAt(...args: Parameters<GetContractAtFromAbi>): Promise<Contract>;

export declare function getContractAtFromArtifact(...args: Parameters<GetContractAtFromArtifact>): Promise<Contract>;

export interface HardhatZksyncEthersHelpers {
    providerL1: ethers.Provider;
    providerL2: Provider;
    provider: Provider;
    getSigners: () => Promise<HardhatZksyncSigner[]>;
    getSigner(address: string): Promise<HardhatZksyncSigner>;
    getWallets: () => Promise<Wallet[]>;
    getWallet: (privateKeyOrIndex?: string | number) => Promise<Wallet>;
    getContractFactory: typeof getContractFactory;
    getContractAt: typeof getContractAt;
    getImpersonatedSigner: (address: string) => Promise<HardhatZksyncSigner>;
    extractFactoryDeps: (artifact: ZkSyncArtifact) => Promise<string[]>;
    loadArtifact: (name: string) => Promise<ZkSyncArtifact>;
    deployContract: (
        artifact: ZkSyncArtifact | string,
        constructorArguments: any[],
        walletOrSigner?: HardhatZksyncSignerOrWallet,
        overrides?: ethers.Overrides,
        additionalFactoryDeps?: ethers.BytesLike[],
    ) => Promise<Contract>;
}
