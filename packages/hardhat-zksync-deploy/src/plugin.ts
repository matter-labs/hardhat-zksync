import { existsSync } from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-web3';
import * as path from 'path';
import fs from 'fs';

import { ZkSyncDeployPluginError } from './errors';
import { Deployer } from './deployer';
import { ContractInfo, LibraryNode, ZkBuildInfo, ZkCompilerOutputSource, ZkCompilerOutputSources, ZkSyncArtifact } from './types';
import { CONTRACT_NODE_TYPE, IMPORT_NODE_TYPE, LIBRARY_CONTRACT_TYPE } from './constants';
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

    const buildInfo = getBuildInfo(hre);

    const sources = buildInfo.output.sources;
    const libraries: LibraryNode[] = [];

    for (const source of Object.values(sources)) {
        let libraryNode = findAllLibraries(sources, source);
        
        if (libraryNode) {
            libraries.push(libraryNode);
        }
    }

    const libraryUsage: Map<string, boolean> = new Map(libraries.map(library => [library.contractName, false]));

    for (const library of libraries) {
        calculateLibraryUsage(library.libraries, libraryUsage);
    }

    let allDeployedLibraries: ContractInfo[] = [];

    clearConfig(hre);

    for (const library of libraries.filter(library => !libraryUsage.get(library.contractName))) {
        console.info(chalk.yellow(`Deploying ${library.contractName} .....`));

        await deployLibrary(hre, deployer, library, allDeployedLibraries);

        console.info(chalk.yellow(`Deploy of ${library.contractName} finished!`));
    }

    updateHardhatConfigFile(hre, allDeployedLibraries, exportedConfigName);

    console.info(chalk.green(`Deploying libraries finished!`));
    clearConfig(hre);
    hre.run('compile', { force: true });
}

async function deployLibrary(hre: HardhatRuntimeEnvironment, deployer: Deployer, library: LibraryNode, allDeployedLibraries: ContractInfo[]): Promise<ContractInfo> {
    const deployedLibrary = allDeployedLibraries.find(l => l.cleanContractName == library.cleanContractName);

    if (deployedLibrary) {
        return deployedLibrary;
    }

    if (library.libraries.length == 0) {
        compileOneContract(hre, library.contractName);
        const artifact = await deployer.loadArtifact(library.cleanContractName);
        return await deployOneLibrary(deployer, artifact, library, allDeployedLibraries);
    }

    const contractInfos = await Promise.all(library.libraries.map(async library => await deployLibrary(hre, deployer, library, allDeployedLibraries)));
    
    fillLibrarySettings(hre, contractInfos);
    compileOneContract(hre, library.contractName);
    const artifact = await deployer.loadArtifact(library.cleanContractName);
    return await deployOneLibrary(deployer, artifact, library, allDeployedLibraries);
}

function findAllLibraries(sources: ZkCompilerOutputSources, source: ZkCompilerOutputSource): LibraryNode | null {
    let contractName = source.ast.absolutePath;
    let cleanContractName = contractName.split('/')[1].split('.')[0];
    let libraryNode: LibraryNode = { contractName: source.ast.absolutePath, cleanContractName, libraries: [] };

    for (const node of source.ast.nodes) {
        if (node.nodeType == CONTRACT_NODE_TYPE
            && node.contractKind != LIBRARY_CONTRACT_TYPE) {
            return null;
        }

        if (node.nodeType == IMPORT_NODE_TYPE) {
            let newLibraryNode = findAllLibraries(sources, sources[node.absolutePath]);

            if (newLibraryNode) {
                libraryNode.libraries.push(newLibraryNode);
            }
        }
    }

    return libraryNode;
}

function calculateLibraryUsage(libraries: LibraryNode[], sourceLibraries: Map<string, boolean>) {
    for (const library of libraries) {
        sourceLibraries.set(library.contractName, true);

        if (library.libraries.length > 0) {
            calculateLibraryUsage(library.libraries, sourceLibraries);
        }
    }
}

function getBuildInfo(hre: HardhatRuntimeEnvironment): ZkBuildInfo {
    const buildInfoPath = hre.config.paths.artifacts + '/build-info';

    const files = fs.readdirSync(buildInfoPath);
    if (files.length == 0) {
        throw new ZkSyncDeployPluginError("Build info not found");
    }

    if (files.length > 1) {
        throw new ZkSyncDeployPluginError("Multiple build info files found");
    }

    return JSON.parse(fs.readFileSync(buildInfoPath + '/' + files[0], 'utf8'));
}

async function deployOneLibrary(deployer: Deployer, artifact: ZkSyncArtifact, library: LibraryNode, allDeployedLibraries: ContractInfo[]): Promise<ContractInfo> {
    const contract = await deployer.deploy(artifact, []);

    console.info(chalk.green(`Deployed ${library.contractName} at ${contract.address}`));

    const contractInfo = { contractName: library.contractName, adress: contract.address, cleanContractName: library.cleanContractName };
    allDeployedLibraries.push(contractInfo);
    return contractInfo;
}

async function fillLibrarySettings(hre: HardhatRuntimeEnvironment, libraries: ContractInfo[]) {
    libraries.forEach((library) => {
        if (hre.config.zksolc.settings.libraries === undefined) {
            hre.config.zksolc.settings.libraries = {};
        }

        if (hre.config.zksolc.settings.libraries[library.contractName] === undefined) {
            hre.config.zksolc.settings.libraries[library.contractName] = { [library.cleanContractName]: library.adress };
        }
    });
}

function clearConfig(hre: HardhatRuntimeEnvironment) {
    hre.config.zksolc.settings.libraries = {};
    hre.config.contractsToCompile = [];
}

function compileOneContract(hre: HardhatRuntimeEnvironment, contractName: string) {
    hre.config.contractsToCompile = [contractName];
    hre.run('compile', { force: true });
}
