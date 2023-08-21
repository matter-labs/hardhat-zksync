import { existsSync } from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-web3';
import * as path from 'path';
import fs from 'fs';

import { ZkSyncDeployPluginError } from './errors';
import { Deployer } from './deployer';
import { ContractInfo, LibraryNode, ZkBuildInfo, ZkCompilerOutputSource, ZkCompilerOutputSources } from './types';
import { CONTRACT_NODE_TYPE, IMPORT_NODE_TYPE, LIBRARY_CONTRACT_TYPE } from './constants';
import chalk from 'chalk';

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

export async function deployLibraries(hre: HardhatRuntimeEnvironment, walletKey: string) {
    const wallet = new Wallet(walletKey);
    const deployer = new Deployer(hre, wallet);

    const buildInfo = getBuildInfo(hre);

    const sources = buildInfo.output.sources;
    const libraries: LibraryNode[] = [];

    for (const source of Object.values(sources)) {
        libraries.push(findAllLibraries(sources, source));
    }

    const libraryUsage: Map<string, boolean> = new Map(libraries.map(library => [library.contractName, false]));

    for (const library of libraries) {
        calculateLibraryUsage(library.libraries, libraryUsage);
    } 

    let deployedLibraries: ContractInfo[] = [];
    clearConfig(hre);

    for (const library of libraries.filter(library => !libraryUsage.get(library.contractName))) {
        deployedLibraries.push(await deployLibrary(hre, deployer, library));
    }
}

async function deployLibrary(hre: HardhatRuntimeEnvironment, deployer: Deployer, library: LibraryNode): Promise<ContractInfo> { 
    const artifact = await deployer.loadArtifact(library.contractName.split('/')[1].split('.')[0]);

    if (library.libraries.length == 0) {
        const contract = await deployer.deploy(artifact, []);
        console.info(chalk.green(`Deployed ${library.contractName} at ${contract.address}`));
        return {contractName: library.contractName, contract};
    }

    const contractInfos = await Promise.all(library.libraries.map(async library => await deployLibrary(hre, deployer, library)));
    contractInfos.forEach((contractInfo) => {
        if(hre.config.zksolc.settings.libraries !== undefined) {
            hre.config.zksolc.settings.libraries[contractInfo.contractName] = {[contractInfo.contractName.split('/')[1].split('.')[0]]: contractInfo.contract.address};
        }
    });
    hre.config.contractsToCompile = [library.contractName];
    hre.run('compile', { force: true });

    const contract = await deployer.deploy(artifact, []);
    console.info(chalk.green(`Deployed ${library.contractName} at ${contract.address}`));
    return {contractName: library.contractName, contract};
}

function findAllLibraries(sources: ZkCompilerOutputSources, source: ZkCompilerOutputSource): LibraryNode {
    let libraryNode: LibraryNode = { contractName: source.ast.absolutePath, libraries: [] };

    for (const node of source.ast.nodes) {
        if (node.nodeType == CONTRACT_NODE_TYPE
            && node.contractKind != LIBRARY_CONTRACT_TYPE) {
            throw new ZkSyncDeployPluginError("Non-library contract found");
        }

        if (node.nodeType == IMPORT_NODE_TYPE) {
            libraryNode.libraries.push(findAllLibraries(sources, sources[node.absolutePath]));
        }
    }

    return libraryNode;
}

function calculateLibraryUsage(libraries: LibraryNode[], sourceLibraries: Map<string, boolean>) {
    for (const library of libraries) {
        sourceLibraries.set(library.contractName, true);

        if(library.libraries.length > 0) {
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

function clearConfig(hre: HardhatRuntimeEnvironment) {
    hre.config.zksolc.settings.libraries = {};
    hre.config.contractsToCompile = [];
}
