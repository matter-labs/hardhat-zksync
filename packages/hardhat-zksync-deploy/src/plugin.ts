import { existsSync } from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Contract, Wallet } from 'zksync-web3';
import * as path from 'path';
import fs from 'fs';

import { ZkSyncDeployPluginError } from './errors';
import { Deployer } from './deployer';
import { LibraryNode, ZkAst, ZkBuildInfo, ZkCompilerOutputSource, ZkCompilerOutputSources } from './types';
import { CONTRACT_NODE_TYPE, IMPORT_NODE_TYPE, LIBRARY_CONTRACT_TYPE } from './constants';
import chalk from 'chalk';
import { defaultZkSolcConfig } from '@matterlabs/hardhat-zksync-solc/dist/src/constants';

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

    for (const library of libraries) {
        await deployLibrary(hre, deployer, library);
    }
}

async function deployLibrary(hre: HardhatRuntimeEnvironment, deployer: Deployer, library: LibraryNode): Promise<Contract> {
    const artifact = await deployer.loadArtifact(library.contractName.split('/')[1]);

    if (library.libraries.length == 0) {
        const contract = await deployer.deploy(artifact, []);
        chalk.green(`Deployed ${library.contractName} at ${contract.address}`);
        return contract;
    }

    const contracts = await Promise.all(library.libraries.map(async library => await deployLibrary(hre, deployer, library)));
    let zkSolcConfig = defaultZkSolcConfig;
    zkSolcConfig.settings.libraries = contracts.reduce((acc, contract) => ({ ...acc, [contract.contractName]: contract.address }), {});
    hre.userConfig.zksolc = zkSolcConfig;  
    hre.run('compile', { force: true });
    const contract = await deployer.deploy(artifact, []);
    return contract;
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

//function notImportedLibraries(libraries: LibraryNode[]): LibraryNode[] {}

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
