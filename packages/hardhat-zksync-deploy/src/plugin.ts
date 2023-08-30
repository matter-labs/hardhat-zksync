import { existsSync } from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as path from 'path';
import fs from 'fs';

import { ZkSyncDeployPluginError } from './errors';
import { Deployer } from './deployer';
import { ContractFullQualifiedName, ContractInfo, MissingLibrary } from './types';
import chalk from 'chalk';
import { compileContracts, fillLibrarySettings, generateFullQuailfiedNameString, getLibraryInfos, getWallet, removeLibraryInfoFile, updateHardhatConfigFile } from './utils';

function getAllFiles(dir: string): string[] {
    const files = [];
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const entryPath = path.join(dir, entry);
        if (fs.lstatSync(entryPath).isDirectory()) {
            files.push(...getAllFiles(entryPath));
        } else {
            files.push(entryPath);
        }
    }
    return files;
}

export function findDeployScripts(hre: HardhatRuntimeEnvironment): string[] {
    const workDir = hre.config.paths.root;
    const deployScriptsDir = path.join(workDir, 'deploy');

    if (!existsSync(deployScriptsDir)) {
        throw new ZkSyncDeployPluginError('No deploy folder was found');
    }

    const deployScripts = getAllFiles(deployScriptsDir).filter(
        (file) => path.extname(file) == '.ts' || path.extname(file) == '.js'
    );

    return deployScripts;
}

export async function callDeployScripts(hre: HardhatRuntimeEnvironment, targetScript: string) {
    const scripts = findDeployScripts(hre);

    if (targetScript == '') {
        // Target script not specified, run everything.
        for (const script of scripts) {
            await runScript(hre, script);
        }
    } else {
        // TODO: Not efficient.
        let found = false;
        for (const script of scripts) {
            if (script.includes(targetScript)) {
                await runScript(hre, script);
                found = true;
                break;
            }
        }
        if (!found) {
            console.error(`Script ${targetScript} was not found, no scripts were run`);
        }
    }
}

async function runScript(hre: HardhatRuntimeEnvironment, script: string) {
    delete require.cache[script];
    let deployFn: any = require(script);

    if (typeof deployFn.default === 'function') {
        deployFn = deployFn.default;
    }

    if (typeof deployFn !== 'function') {
        throw new ZkSyncDeployPluginError('Deploy function does not exist or exported invalidly');
    }

    await deployFn(hre);
}

export async function deployLibraries(
    hre: HardhatRuntimeEnvironment, 
    privateKey: string,
    accountNumber: number, 
    externalConfigObjectPath: string, 
    exportedConfigObject: string,
    noAutoPopulateConfig: boolean, 
    compileAllContracts: boolean
) {
    const wallet = getWallet(hre, privateKey, accountNumber);
    const deployer = new Deployer(hre, wallet);

    const libraryInfos = getLibraryInfos(hre);
    const allDeployedLibraries: ContractInfo[] = [];

    hre.config.zksolc.settings.contractsToCompile = [];

    for (const libraryInfo of libraryInfos) {
        const compileInfo = await deployLibrary(hre, deployer, libraryInfo, libraryInfos, allDeployedLibraries);
        fillLibrarySettings(hre, [compileInfo]);
    }

    console.info(chalk.green('All libraries deployed successfully!'));

    if (!noAutoPopulateConfig) {
        updateHardhatConfigFile(hre, externalConfigObjectPath, exportedConfigObject);
    }

    removeLibraryInfoFile(hre);

    if(compileAllContracts) {
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
    allDeployedLibraries: ContractInfo[]
): Promise<ContractInfo> {
    const deployedLibrary = allDeployedLibraries
        .find(deployedLibrary => generateFullQuailfiedNameString(missingLibrary)
            .includes(generateFullQuailfiedNameString(deployedLibrary.contractFQN))
        );

    if (deployedLibrary) {
        return deployedLibrary;
    }

    const contractFQN = {
        contractName: missingLibrary.contractName,
        contractPath: missingLibrary.contractPath
    };

    if (missingLibrary.missingLibraries.length == 0) {
        return await compileAndDeploy(hre, deployer, contractFQN, allDeployedLibraries);
    }

    const dependentLibraries = findDependentLibraries(missingLibrary.missingLibraries, missingLibraries);
    const contractInfos = await Promise.all(
        Array.from(dependentLibraries)
            .map(async dependentLibrary =>
                await deployLibrary(hre, deployer, dependentLibrary, missingLibraries, allDeployedLibraries)
            )
    );

    fillLibrarySettings(hre, contractInfos);
    return await compileAndDeploy(hre, deployer, contractFQN, allDeployedLibraries);
}

function findDependentLibraries(dependentLibraries: string[], missingLibraries: MissingLibrary[]): MissingLibrary[] {
    return dependentLibraries.map(dependentLibrary => {
        const dependentFQNString = dependentLibrary.split(':');
        const dependentFQN = {
            contractName: dependentFQNString[1],
            contractPath: dependentFQNString[0]
        }

        const foundMissingLibrary = missingLibraries
            .find(missingLibrary => generateFullQuailfiedNameString(missingLibrary)
                .includes(generateFullQuailfiedNameString(dependentFQN)));

        if (!foundMissingLibrary) {
            throw new ZkSyncDeployPluginError(`Missing library ${dependentLibrary} not found`);
        }

        return foundMissingLibrary;
    });
}

async function deployOneLibrary(
    deployer: Deployer,
    contractFQN: ContractFullQualifiedName,
    allDeployedLibraries: ContractInfo[]
): Promise<ContractInfo> {
    const artifact = await deployer.loadArtifact(generateFullQuailfiedNameString(contractFQN));

    console.info(chalk.yellow(`Deploying ${generateFullQuailfiedNameString(contractFQN)} .....`));
    const contract = await deployer.deploy(artifact, []);
    console.info(chalk.green(`Deployed ${generateFullQuailfiedNameString(contractFQN)} at ${contract.address}`));

    const contractInfo = {
        contractFQN,
        address: contract.address
    };

    allDeployedLibraries.push(contractInfo);
    return contractInfo;
}

async function compileAndDeploy(
    hre: HardhatRuntimeEnvironment,
    deployer: Deployer,
    contractFQN: ContractFullQualifiedName,
    allDeployedLibraries: ContractInfo[]
): Promise<ContractInfo> {
    await compileContracts(hre, [contractFQN.contractPath]);

    return await deployOneLibrary(deployer, contractFQN, allDeployedLibraries);
}
