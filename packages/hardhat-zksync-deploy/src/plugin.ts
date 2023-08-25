import { existsSync } from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-web3';
import * as path from 'path';
import fs from 'fs';

import { ZkSyncDeployPluginError } from './errors';
import { Deployer } from './deployer';
import { ContractInfo, ContractNameDetails, MissingLibrary, ZkSyncArtifact } from './types';
import chalk from 'chalk';
import { updateHardhatConfigFile } from './utils';

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

export async function deployLibraries(hre: HardhatRuntimeEnvironment, walletKey: string, exportedConfigName: string) {
    const wallet = new Wallet(walletKey);
    const deployer = new Deployer(hre, wallet);

    const libraryInfos = getLibraryInfos(hre);
    const allDeployedLibraries: ContractInfo[] = [];

    hre.config.zksolc.settings.contractsToCompile = [];

    for (const libraryInfo of libraryInfos) {
        const compileInfo = await deployLibrary(hre, deployer, libraryInfo, libraryInfos, allDeployedLibraries);
        fillLibrarySettings(hre, [compileInfo]);
    }

    updateHardhatConfigFile(hre, exportedConfigName);
    cleanLibraryInfoFile(hre);

    await compileContracts(hre, []);
}

async function deployLibrary(hre: HardhatRuntimeEnvironment,
    deployer: Deployer,
    missingLibrary: MissingLibrary,
    missingLibraries: MissingLibrary[],
    allDeployedLibraries: ContractInfo[]): Promise<ContractInfo> {
    const deployedLibrary = allDeployedLibraries
        .find(deployedLibrary => generateFullQuailfiedName(missingLibrary)
            .includes(generateFullQuailfiedName(deployedLibrary.contractNameDetails))
        );

    if (deployedLibrary) {
        return deployedLibrary;
    }

    const contractNameDetails = {
        contractName: missingLibrary.contractName,
        contractPath: missingLibrary.contractPath
    };


    if (missingLibrary.missingLibraries.length == 0) {
        return await compileAndDeploy(hre, deployer, contractNameDetails, allDeployedLibraries);
    }

    const dependentLibraries = findDependentLibraries(missingLibrary.missingLibraries, missingLibraries);
    const contractInfos = await Promise.all(
        Array.from(dependentLibraries)
            .map(async dependentLibrary =>
                await deployLibrary(hre, deployer, dependentLibrary, missingLibraries, allDeployedLibraries)
            )
    );

    fillLibrarySettings(hre, contractInfos);
    return await compileAndDeploy(hre, deployer, contractNameDetails, allDeployedLibraries);
}

function findDependentLibraries(dependentLibraries: string[], missingLibraries: MissingLibrary[]): MissingLibrary[] {
    return dependentLibraries.map(dependentLibrary => {
        const dependentLibraryName = dependentLibrary.split(':');
        const dependentLibraryNameDetails = {
            contractName: dependentLibraryName[1],
            contractPath: dependentLibraryName[0]
        }

        const foundMissingLibrary = missingLibraries
            .find(missingLibrary => generateFullQuailfiedName(missingLibrary)
                .includes(generateFullQuailfiedName(dependentLibraryNameDetails)));

        if (!foundMissingLibrary) {
            throw new ZkSyncDeployPluginError(`Missing library ${dependentLibrary} not found`);
        }

        return foundMissingLibrary;
    });
}

function getLibraryInfos(hre: HardhatRuntimeEnvironment): Array<MissingLibrary> {
    const libraryPathFile = hre.config.zksolc.settings.missingLibrariesPath!;

    if (!fs.existsSync(libraryPathFile)) {
        throw new ZkSyncDeployPluginError('Missing librararies file not found');
    }

    return JSON.parse(fs.readFileSync(libraryPathFile, 'utf8'));
}

function cleanLibraryInfoFile(hre: HardhatRuntimeEnvironment) {
    const libraryPathFile = hre.config.zksolc.settings.missingLibrariesPath!;

    if (fs.existsSync(libraryPathFile)) {
        fs.rmSync(libraryPathFile);
    }
}

async function deployOneLibrary(deployer: Deployer,
    contractNameDetails: ContractNameDetails,
    allDeployedLibraries: ContractInfo[]): Promise<ContractInfo> {
    const artifact = await deployer.loadArtifact(generateFullQuailfiedName(contractNameDetails));

    console.info(chalk.yellow(`Deploying ${contractNameDetails.contractPath} .....`));
    const contract = await deployer.deploy(artifact, []);
    console.info(chalk.green(`Deployed ${contractNameDetails.contractPath} at ${contract.address}`));

    const contractInfo = {
        contractNameDetails,
        address: contract.address
    };
    allDeployedLibraries.push(contractInfo);
    return contractInfo;
}

async function fillLibrarySettings(hre: HardhatRuntimeEnvironment, libraries: ContractInfo[]) {
    libraries.forEach((library) => {
        let contractPath = library.contractNameDetails.contractPath;
        let contractName = library.contractNameDetails.contractName;

        if (!hre.config.zksolc.settings.libraries) {
            hre.config.zksolc.settings.libraries = {};
        }

        hre.config.zksolc.settings.libraries[contractPath] = {
            [contractName]: library.address
        };
    });
}

async function compileAndDeploy(hre: HardhatRuntimeEnvironment,
    deployer: Deployer,
    contractNameDetails: ContractNameDetails,
    allDeployedLibraries: ContractInfo[]): Promise<ContractInfo> {
    await compileContracts(hre, [contractNameDetails.contractPath]);

    return await deployOneLibrary(deployer, contractNameDetails, allDeployedLibraries);
}

async function compileContracts(hre: HardhatRuntimeEnvironment, contracts: string[]) {
    hre.config.zksolc.settings.contractsToCompile = contracts;

    await hre.run('compile', { force: true });
}

function generateFullQuailfiedName(contractNameDetails: ContractNameDetails | MissingLibrary): string {
    return contractNameDetails.contractPath + ":" + contractNameDetails.contractName;
}
