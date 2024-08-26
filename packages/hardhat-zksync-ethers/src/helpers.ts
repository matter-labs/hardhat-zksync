import { Contract, ContractFactory, Wallet } from 'zksync-ethers';

import * as ethers from 'ethers';

import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { Address, DeploymentType } from 'zksync-ethers/build/types';
import {
    GetContractAt,
    GetContractAtFromAbi,
    GetContractAtFromArtifact,
    GetContractAtFromName,
    GetContractFactory,
    GetContractFactoryAbiBytecode,
    GetContractFactoryArtifact,
    GetContractFactoryArtifactName,
    HardhatZksyncSignerOrWallet,
    HardhatZksyncSignerOrWalletOrFactoryOptions,
    ZkSyncArtifact,
} from './types';
import { ZkSyncEthersPluginError } from './errors';
import { getSignerAccounts, getSignerOrWallet, getWalletsFromAccount, isArtifact, isNumber, isString } from './utils';
import { ZKSOLC_ARTIFACT_FORMAT_VERSION, ZKVYPER_ARTIFACT_FORMAT_VERSION } from './constants';
import { HardhatZksyncSigner } from './signers/hardhat-zksync-signer';

export async function getWallet(hre: HardhatRuntimeEnvironment, privateKeyOrIndex?: string | number): Promise<Wallet> {
    const privateKey = isString(privateKeyOrIndex) ? (privateKeyOrIndex as string) : undefined;
    const accountNumber = isNumber(privateKeyOrIndex) ? (privateKeyOrIndex as number) : undefined;

    if (privateKey) {
        return new Wallet(privateKey, hre.ethers.provider).connectToL1(hre.ethers.providerL1);
    }

    const accounts = hre.network.config.accounts;

    const wallets = await getWalletsFromAccount(hre, accounts);

    if (accountNumber && accountNumber >= wallets.length) {
        throw new ZkSyncEthersPluginError('Account private key with specified index is not found');
    }

    if (wallets.length === 0) {
        throw new ZkSyncEthersPluginError('Accounts are not configured for this network');
    }

    return wallets[accountNumber || 0];
}

export async function getWallets(hre: HardhatRuntimeEnvironment): Promise<Wallet[]> {
    const accounts = hre.network.config.accounts;

    return await getWalletsFromAccount(hre, accounts);
}

export async function getSigners(hre: HardhatRuntimeEnvironment): Promise<HardhatZksyncSigner[]> {
    const accounts: string[] = await getSignerAccounts(hre);

    const signersWithAddress = await Promise.all(accounts.map((account) => getSigner(hre, account)));

    return signersWithAddress;
}

export async function getSigner(hre: HardhatRuntimeEnvironment, address: string): Promise<HardhatZksyncSigner> {
    const { HardhatZksyncSigner: SignerWithAddressImpl } = await import('./signers/hardhat-zksync-signer');

    return await SignerWithAddressImpl.create(hre, hre.ethers.provider, address);
}

export async function getImpersonatedSigner(
    hre: HardhatRuntimeEnvironment,
    address: string,
): Promise<HardhatZksyncSigner> {
    await hre.ethers.provider.send('hardhat_impersonateAccount', [address]);
    return await getSigner(hre, address);
}

export function makeGetContractFactory(hre: HardhatRuntimeEnvironment): GetContractFactory {
    return async function <A extends any[] = any[], I = Contract>(
        ...args: Parameters<
            | GetContractFactoryArtifact<A, I>
            | GetContractFactoryArtifactName<A, I>
            | GetContractFactoryAbiBytecode<A, I>
        >
    ): Promise<ContractFactory<A, I>> {
        if (isArtifact(args[0])) {
            return getContractFactoryFromArtifact(hre, ...(args as Parameters<GetContractFactoryArtifact<A, I>>));
        }

        if (args[0] instanceof Array && ethers.isBytesLike(args[1])) {
            return getContractFactoryByAbiAndBytecode(
                hre,
                ...(args as Parameters<GetContractFactoryAbiBytecode<A, I>>),
            );
        }

        if (typeof args[0] === 'string') {
            const artifact = await loadArtifact(hre, args[0] as string);

            return getContractFactoryFromArtifact(
                hre,
                artifact,
                args[1] as HardhatZksyncSignerOrWalletOrFactoryOptions,
                args[2] as DeploymentType,
            );
        }

        throw new ZkSyncEthersPluginError(
            `You are trying to create a contract factory, but you have not passed a valid parameter.`,
        );
    };
}

export async function getContractFactoryFromArtifact<A extends any[] = any[], I = Contract>(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    walletOrSignerOrOptions?: HardhatZksyncSignerOrWalletOrFactoryOptions,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<A, I>> {
    if (!isArtifact(artifact)) {
        throw new ZkSyncEthersPluginError(
            `You are trying to create a contract factory from an artifact, but you have not passed a valid artifact parameter.`,
        );
    }

    if (artifact.bytecode === '0x') {
        throw new ZkSyncEthersPluginError(
            `You are trying to create a contract factory for the contract ${artifact.contractName}, which is abstract and can't be deployed.
If you want to call a contract using ${artifact.contractName} as its interface use the "getContractAt" function instead.`,
        );
    }

    return getContractFactoryByAbiAndBytecode(
        hre,
        artifact.abi,
        artifact.bytecode,
        walletOrSignerOrOptions,
        deploymentType,
    );
}

async function getContractFactoryByAbiAndBytecode<A extends any[] = any[], I = Contract>(
    hre: HardhatRuntimeEnvironment,
    abi: any[],
    bytecode: ethers.BytesLike,
    walletOrSignerOrOptions?: HardhatZksyncSignerOrWalletOrFactoryOptions,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<A, I>> {
    let walletOrSigner: HardhatZksyncSignerOrWallet | undefined = getSignerOrWallet(walletOrSignerOrOptions);

    if (!walletOrSigner) {
        walletOrSigner = (await getSigners(hre))[0];
    }

    return new ContractFactory<A, I>(abi, bytecode, walletOrSigner, deploymentType);
}

export function makeContractAt(hre: HardhatRuntimeEnvironment): GetContractAt {
    return async function getContractAt(
        ...args: Parameters<GetContractAtFromName | GetContractAtFromAbi | GetContractAtFromArtifact>
    ): Promise<Contract> {
        if (isArtifact(args[0])) {
            return getContractAtFromArtifact(hre, ...(args as Parameters<GetContractAtFromArtifact>));
        }

        if (typeof args[0] === 'string') {
            const artifact = await loadArtifact(hre, args[0]);
            return getContractAtFromArtifact(
                hre,
                artifact,
                args[1] as string | Address,
                args[2] as HardhatZksyncSignerOrWallet,
            );
        }

        return getContractAtFromAbi(hre, ...(args as Parameters<GetContractAtFromAbi>));
    };
}

export async function getContractAtFromArtifact(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    address: string | Address,
    walletOrSigner?: HardhatZksyncSignerOrWallet,
): Promise<Contract> {
    return getContractAtFromAbi(hre, artifact.abi, address, walletOrSigner);
}

async function getContractAtFromAbi(
    hre: HardhatRuntimeEnvironment,
    abi: any[],
    address: string | Address,
    walletOrSigner?: HardhatZksyncSignerOrWallet,
): Promise<Contract> {
    if (!walletOrSigner) {
        walletOrSigner = (await getSigners(hre))[0];
    }

    let contract = new Contract(address, abi, walletOrSigner);

    if (contract.runner === null) {
        contract = contract.connect(hre.ethers.provider) as Contract;
    }

    return contract;
}

export async function deployContract(
    hre: HardhatRuntimeEnvironment,
    artifactOrContract: ZkSyncArtifact | string,
    constructorArguments: any[] = [],
    walletOrSigner?: HardhatZksyncSignerOrWallet,
    overrides?: ethers.Overrides,
    additionalFactoryDeps?: ethers.BytesLike[],
): Promise<Contract> {
    if (!walletOrSigner) {
        walletOrSigner = (await getSigners(hre))[0];
    }

    const artifact =
        typeof artifactOrContract === 'string' ? await loadArtifact(hre, artifactOrContract) : artifactOrContract;

    const factory = await getContractFactoryFromArtifact(hre, artifact, walletOrSigner);

    const baseDeps = await extractFactoryDeps(hre, artifact);
    const additionalDeps = additionalFactoryDeps ? additionalFactoryDeps.map((val) => ethers.hexlify(val)) : [];
    const factoryDeps = [...baseDeps, ...additionalDeps];

    const { customData, ..._overrides } = overrides ?? {};

    // Encode and send the deploy transaction providing factory dependencies.
    const contract = await factory.deploy(...constructorArguments, {
        ..._overrides,
        customData: {
            ...customData,
            factoryDeps,
        },
    });

    await contract.waitForDeployment();

    return contract;
}

export async function loadArtifact(
    hre: HardhatRuntimeEnvironment,
    contractNameOrFullyQualifiedName: string,
): Promise<ZkSyncArtifact> {
    const artifact = await hre.artifacts.readArtifact(contractNameOrFullyQualifiedName);

    // Verify that this artifact was compiled by the ZKsync compiler, and not `solc` or `vyper`.
    if (artifact._format !== ZKSOLC_ARTIFACT_FORMAT_VERSION && artifact._format !== ZKVYPER_ARTIFACT_FORMAT_VERSION) {
        throw new ZkSyncEthersPluginError(
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

async function extractFactoryDepsRecursive(
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
