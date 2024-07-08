import { Contract, ContractFactory, Provider, Signer, Wallet } from 'zksync-ethers';

import * as ethers from 'ethers';

import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { Address, DeploymentType } from 'zksync-ethers/build/types';
import fs from 'fs';
import chalk from 'chalk';
import { ZkSyncEthersPluginError } from './errors';
import { richWallets } from './rich-wallets';
import { ZKSOLC_ARTIFACT_FORMAT_VERSION, ZKVYPER_ARTIFACT_FORMAT_VERSION } from './constants';
import {
    getWalletsFromAccount,
    isArtifact,
    isFactoryOptions,
    isNumber,
    isString,
    compileContracts,
    fillLibrarySettings,
    generateFullQuailfiedNameString,
    getLibraryInfos,
    removeLibraryInfoFile,
    updateHardhatConfigFile,
} from './utils';
import { FactoryOptions, ZkSyncArtifact, ContractFullQualifiedName, ContractInfo, MissingLibrary } from './types';

export async function getWallet(hre: HardhatRuntimeEnvironment, privateKeyOrIndex?: string | number): Promise<Wallet> {
    const privateKey = isString(privateKeyOrIndex) ? (privateKeyOrIndex as string) : undefined;
    const accountNumber = isNumber(privateKeyOrIndex) ? (privateKeyOrIndex as number) : undefined;

    if (privateKey) {
        return new Wallet(privateKey, hre.zksyncEthers.providerL2).connectToL1(hre.zksyncEthers.providerL1);
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

function _getSigners(hre: HardhatRuntimeEnvironment): Signer[] {
    const accounts: string[] = richWallets.map((wallet) => wallet.address);

    const signersWithAddress = accounts.map((account) => getSigner(hre, account));

    return signersWithAddress;
}

function getSigner(hre: HardhatRuntimeEnvironment, address: string): Signer {
    return Signer.from(new Signer(hre.zksyncEthers.providerL2, address), hre.network.config.chainId!);
}

export async function getImpersonatedSigner(hre: HardhatRuntimeEnvironment, address: string): Promise<Signer> {
    await hre.zksyncEthers.providerL2.send('hardhat_impersonateAccount', [address]);
    return getSigner(hre, address);
}

export async function getContractFactory<A extends any[] = any[], I = Contract>(
    hre: HardhatRuntimeEnvironment,
    name: string,
    walletOrOption?: Wallet | FactoryOptions,
): Promise<ContractFactory<A, I>>;

export async function getContractFactory<A extends any[] = any[], I = Contract>(
    hre: HardhatRuntimeEnvironment,
    abi: any[],
    bytecode: ethers.BytesLike,
    wallet?: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<A, I>>;

export async function getContractFactory<A extends any[] = any[], I = Contract>(
    hre: HardhatRuntimeEnvironment,
    nameOrAbi: string | any[],
    bytecodeOrFactoryOptions?: (Wallet | FactoryOptions) | ethers.BytesLike,
    wallet?: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<A, I>> {
    if (typeof nameOrAbi === 'string') {
        const artifact = await loadArtifact(hre, nameOrAbi);

        return getContractFactoryFromArtifact(
            hre,
            artifact,
            bytecodeOrFactoryOptions as Wallet | FactoryOptions | undefined,
            deploymentType,
        );
    }

    return getContractFactoryByAbiAndBytecode(
        hre,
        nameOrAbi,
        bytecodeOrFactoryOptions as ethers.BytesLike,
        wallet,
        deploymentType,
    );
}

export async function getContractFactoryFromArtifact<A extends any[] = any[], I = Contract>(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    walletOrOptions?: Wallet | FactoryOptions,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<A, I>> {
    let wallet: Wallet | undefined;

    if (!isArtifact(artifact)) {
        throw new ZkSyncEthersPluginError(
            `You are trying to create a contract factory from an artifact, but you have not passed a valid artifact parameter.`,
        );
    }

    if (isFactoryOptions(walletOrOptions)) {
        wallet = walletOrOptions.wallet;
    } else {
        wallet = walletOrOptions;
    }

    if (artifact.bytecode === '0x') {
        throw new ZkSyncEthersPluginError(
            `You are trying to create a contract factory for the contract ${artifact.contractName}, which is abstract and can't be deployed.
If you want to call a contract using ${artifact.contractName} as its interface use the "getContractAt" function instead.`,
        );
    }

    return getContractFactoryByAbiAndBytecode(hre, artifact.abi, artifact.bytecode, wallet, deploymentType);
}

async function getContractFactoryByAbiAndBytecode<A extends any[] = any[], I = Contract>(
    hre: HardhatRuntimeEnvironment,
    abi: any[],
    bytecode: ethers.BytesLike,
    wallet?: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<A, I>> {
    if (!wallet) {
        wallet = await getWallet(hre);
    }

    return new ContractFactory<A, I>(abi, bytecode, wallet, deploymentType);
}

export async function getContractAt(
    hre: HardhatRuntimeEnvironment,
    nameOrAbi: string | any[],
    address: string | Address,
    wallet?: Wallet,
): Promise<Contract> {
    if (typeof nameOrAbi === 'string') {
        const artifact = await loadArtifact(hre, nameOrAbi);

        return getContractAtFromArtifact(hre, artifact, address, wallet);
    }

    if (!wallet) {
        wallet = await getWallet(hre);
    }

    // If there's no signer, we want to put the provider for the selected network here.
    // This allows read only operations on the contract interface.
    const walletOrProvider: Wallet | Provider = wallet !== undefined ? wallet : hre.zksyncEthers.providerL2;

    return new Contract(address, nameOrAbi, walletOrProvider);
}

export async function getContractAtFromArtifact(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    address: string | Address,
    wallet?: Wallet,
): Promise<Contract> {
    if (!isArtifact(artifact)) {
        throw new ZkSyncEthersPluginError(
            `You are trying to create a contract by artifact, but you have not passed a valid artifact parameter.`,
        );
    }

    if (!wallet) {
        wallet = await getWallet(hre);
    }

    let contract = new Contract(address, artifact.abi, wallet);

    if (contract.runner === null) {
        contract = contract.connect(hre.zksyncEthers.providerL2) as Contract;
    }

    return contract;
}

export async function deployContract(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    constructorArguments: any[],
    wallet?: Wallet,
    overrides?: ethers.Overrides,
    additionalFactoryDeps?: ethers.BytesLike[],
): Promise<Contract> {
    if (!wallet) {
        wallet = await getWallet(hre);
    }

    const factory = await getContractFactoryFromArtifact(hre, artifact, wallet);

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

    // Verify that this artifact was compiled by the zkSync compiler, and not `solc` or `vyper`.
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

export async function deployLibraries(
    hre: HardhatRuntimeEnvironment,
    wallet?: Wallet,
    externalConfigObjectPath?: string,
    exportedConfigObject?: string,
    noAutoPopulateConfig?: boolean,
    compileAllContracts: boolean = true,
) {
    const isDeployLibrariesNeeded = await checkIsDeployLibrariesNeeded(hre);

    if (!isDeployLibrariesNeeded) {
        return;
    }

    const libraryInfos = getLibraryInfos(hre);

    const allDeployedLibraries: ContractInfo[] = [];

    if (libraryInfos.length === 0) {
        return;
    }

    if (!wallet) {
        wallet = await getWallet(hre);
    }

    // @ts-ignore
    hre.config.zksolc.settings.contractsToCompile = [];

    for (const libraryInfo of libraryInfos) {
        const compileInfo = await deployLibrary(hre, wallet, libraryInfo, libraryInfos, allDeployedLibraries);
        const _ = fillLibrarySettings(hre, [compileInfo]);
    }

    console.info(chalk.green('All libraries deployed successfully!'));

    if (!noAutoPopulateConfig) {
        updateHardhatConfigFile(hre, externalConfigObjectPath, exportedConfigObject);
    }

    removeLibraryInfoFile(hre);

    if (compileAllContracts) {
        console.info(chalk.yellow('Compiling all contracts'));
        await compileContracts(hre, []);
    } else {
        console.info(chalk.yellow(`Please run ${chalk.green('yarn hardhat compile')} to compile all contracts`));
    }
}

async function deployLibrary(
    hre: HardhatRuntimeEnvironment,
    wallet: Wallet,
    missingLibrary: MissingLibrary,
    missingLibraries: MissingLibrary[],
    allDeployedLibraries: ContractInfo[],
): Promise<ContractInfo> {
    const deployedLibrary = allDeployedLibraries.find((deplLibrary) =>
        generateFullQuailfiedNameString(missingLibrary).includes(
            generateFullQuailfiedNameString(deplLibrary.contractFQN),
        ),
    );

    if (deployedLibrary) {
        return deployedLibrary;
    }

    const contractFQN = {
        contractName: missingLibrary.contractName,
        contractPath: missingLibrary.contractPath,
    };

    if (missingLibrary.missingLibraries.length === 0) {
        return await compileAndDeploy(hre, wallet, contractFQN, allDeployedLibraries);
    }

    const dependentLibraries = findDependentLibraries(missingLibrary.missingLibraries, missingLibraries);
    const contractInfos = await Promise.all(
        Array.from(dependentLibraries).map(async (dependentLibrary) =>
            deployLibrary(hre, wallet, dependentLibrary, missingLibraries, allDeployedLibraries),
        ),
    );

    const _ = fillLibrarySettings(hre, contractInfos);
    return await compileAndDeploy(hre, wallet, contractFQN, allDeployedLibraries);
}

function findDependentLibraries(dependentLibraries: string[], missingLibraries: MissingLibrary[]): MissingLibrary[] {
    return dependentLibraries.map((dependentLibrary) => {
        const dependentFQNString = dependentLibrary.split(':');
        const dependentFQN = {
            contractName: dependentFQNString[1],
            contractPath: dependentFQNString[0],
        };

        const foundMissingLibrary = missingLibraries.find((missingLibrary) =>
            generateFullQuailfiedNameString(missingLibrary).includes(generateFullQuailfiedNameString(dependentFQN)),
        );

        if (!foundMissingLibrary) {
            throw new ZkSyncEthersPluginError(`Missing library ${dependentLibrary} not found`);
        }

        return foundMissingLibrary;
    });
}

async function deployOneLibrary(
    hre: HardhatRuntimeEnvironment,
    wallet: Wallet,
    contractFQN: ContractFullQualifiedName,
    allDeployedLibraries: ContractInfo[],
): Promise<ContractInfo> {
    const artifact = await loadArtifact(hre, generateFullQuailfiedNameString(contractFQN));

    console.info(chalk.yellow(`Deploying ${generateFullQuailfiedNameString(contractFQN)} .....`));
    const contract = await deployContract(hre, artifact, [], wallet);
    console.info(
        chalk.green(`Deployed ${generateFullQuailfiedNameString(contractFQN)} at ${await contract.getAddress()}`),
    );

    const contractInfo: ContractInfo = {
        contractFQN,
        address: await contract.getAddress(),
    };

    allDeployedLibraries.push(contractInfo);
    return contractInfo;
}

async function compileAndDeploy(
    hre: HardhatRuntimeEnvironment,
    wallet: Wallet,
    contractFQN: ContractFullQualifiedName,
    allDeployedLibraries: ContractInfo[],
): Promise<ContractInfo> {
    await compileContracts(hre, [contractFQN.contractPath]);

    return await deployOneLibrary(hre, wallet, contractFQN, allDeployedLibraries);
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

export interface DeployLibraryChecker {
    check: (hre: HardhatRuntimeEnvironment) => Promise<boolean>;
}

export class MissingLibraryFileChecker implements DeployLibraryChecker {
    public async check(hre: HardhatRuntimeEnvironment): Promise<boolean> {
        return fs.existsSync(hre.config.zksolc.settings.missingLibrariesPath!);
    }
}

export class LibrariesExistOnNetworkChecker implements DeployLibraryChecker {
    public async check(hre: HardhatRuntimeEnvironment): Promise<boolean> {
        if (!hre.config.zksolc?.settings?.libraries) {
            return false;
        }

        return Object.entries(hre.config.zksolc.settings.libraries!).some(([_, libraries]) => {
            return Object.values(libraries).some(
                async (library) => (await hre.zksyncEthers.providerL2.getCode(library)) === '0x',
            );
        });
    }
}

async function checkIsDeployLibrariesNeeded(hre: HardhatRuntimeEnvironment) {
    const checkers: DeployLibraryChecker[] = [new LibrariesExistOnNetworkChecker(), new MissingLibraryFileChecker()];

    return checkers.some(async (checker) => await checker.check(hre));
}
