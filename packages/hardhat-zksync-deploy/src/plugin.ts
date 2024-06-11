import { HardhatRuntimeEnvironment } from 'hardhat/types';

import chalk from 'chalk';
import { Contract, Wallet } from 'zksync-ethers';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { DeploymentType } from 'zksync-ethers/build/types';
import { ZkSyncDeployPluginError } from './errors';
import { Deployer } from './deployer';
import { ContractFullQualifiedName, ContractInfo, MissingLibrary } from './types';
import {
    compileContracts,
    fillLibrarySettings,
    generateFullQuailfiedNameString,
    getConstructorArguments,
    getLibraryInfos,
    getWalletsFromAccount,
    isNumber,
    isString,
    removeLibraryInfoFile,
    updateHardhatConfigFile,
} from './utils';

export async function deployLibraries(
    hre: HardhatRuntimeEnvironment,
    privateKeyOrAccountNumber: string | number,
    externalConfigObjectPath: string,
    exportedConfigObject: string,
    noAutoPopulateConfig: boolean,
    compileAllContracts: boolean,
) {
    const wallet = await getWallet(hre, privateKeyOrAccountNumber ?? getNetworkAccount(hre));
    const deployer = new Deployer(hre, wallet);

    const libraryInfos = getLibraryInfos(hre);
    const allDeployedLibraries: ContractInfo[] = [];

    // @ts-ignore
    hre.config.zksolc.settings.contractsToCompile = [];

    for (const libraryInfo of libraryInfos) {
        const compileInfo = await deployLibrary(hre, deployer, libraryInfo, libraryInfos, allDeployedLibraries);
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
    deployer: Deployer,
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
        return await compileAndDeploy(hre, deployer, contractFQN, allDeployedLibraries);
    }

    const dependentLibraries = findDependentLibraries(missingLibrary.missingLibraries, missingLibraries);
    const contractInfos = await Promise.all(
        Array.from(dependentLibraries).map(async (dependentLibrary) =>
            deployLibrary(hre, deployer, dependentLibrary, missingLibraries, allDeployedLibraries),
        ),
    );

    const _ = fillLibrarySettings(hre, contractInfos);
    return await compileAndDeploy(hre, deployer, contractFQN, allDeployedLibraries);
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
            throw new ZkSyncDeployPluginError(`Missing library ${dependentLibrary} not found`);
        }

        return foundMissingLibrary;
    });
}

async function deployOneLibrary(
    deployer: Deployer,
    contractFQN: ContractFullQualifiedName,
    allDeployedLibraries: ContractInfo[],
): Promise<ContractInfo> {
    const artifact = await deployer.loadArtifact(generateFullQuailfiedNameString(contractFQN));

    console.info(chalk.yellow(`Deploying ${generateFullQuailfiedNameString(contractFQN)} .....`));
    const contract = await deployer.deploy(artifact, []);
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
    deployer: Deployer,
    contractFQN: ContractFullQualifiedName,
    allDeployedLibraries: ContractInfo[],
): Promise<ContractInfo> {
    await compileContracts(hre, [contractFQN.contractPath]);

    return await deployOneLibrary(deployer, contractFQN, allDeployedLibraries);
}

export async function getWallet(hre: HardhatRuntimeEnvironment, privateKeyOrIndex?: string | number): Promise<Wallet> {
    const privateKey = isString(privateKeyOrIndex) ? (privateKeyOrIndex as string) : undefined;
    const accountNumber = isNumber(privateKeyOrIndex) ? (privateKeyOrIndex as number) : undefined;

    if (privateKey) {
        return new Wallet(privateKey);
    }

    const accounts = hre.network.config.accounts;

    const wallets = await getWalletsFromAccount(hre, accounts);

    if (accountNumber && accountNumber >= wallets.length) {
        throw new ZkSyncDeployPluginError('Account private key with specified index is not found');
    }

    if (wallets.length === 0) {
        throw new ZkSyncDeployPluginError('Accounts are not configured for this network');
    }

    return wallets[accountNumber || 0];
}

export async function getWallets(hre: HardhatRuntimeEnvironment): Promise<Wallet[]> {
    const accounts = hre.network.config.accounts;

    return await getWalletsFromAccount(hre, accounts);
}

export function getNetworkAccount(hre: HardhatRuntimeEnvironment): number {
    const networkName = hre.network.name;
    return hre.config.deployerAccounts[networkName] ?? hre.config.deployerAccounts.default ?? 0;
}

export async function deployContract(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        deploymentType?: DeploymentType;
        salt?: string;
        noCompile?: boolean;
    },
): Promise<Contract> {
    if (!taskArgs.noCompile) {
        await hre.run(TASK_COMPILE);
    }

    const constructorArguments: any[] = await getConstructorArguments(
        taskArgs.constructorArgsParams,
        taskArgs.constructorArgs,
    );

    const contract: Contract = await hre.deployer.deploy(
        taskArgs.contractName,
        constructorArguments,
        taskArgs.deploymentType,
        {
            customData: {
                salt: taskArgs.salt,
            },
        },
    );
    console.log(chalk.green(`Contract ${taskArgs.contractName} deployed at ${await contract.getAddress()}`));
    return contract;
}
