import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as fse from 'fs-extra';
import path from 'path';
import lodash from 'lodash';
import { DeploymentType } from 'zksync-ethers/build/types';
import { ZkSyncArtifact } from './types';
import { retrieveContractBytecode } from './utils';

export interface DeploymentEntry {
    constructorArgs: any[];
    salt: string;
    deploymentType: DeploymentType;
    factoryDeps: string[];
    address: string;
    txHash: string;
}

export interface EntryToFind {
    constructorArgs: any[];
    salt: string;
    deploymentType: DeploymentType;
    factoryDeps: string[];
}

export interface Deployment {
    contractName: string;
    sourceName: string;
    abi: {};
    bytecode: string;
    entries: DeploymentEntry[];
}

export const DEPLOYMENT_PATH: string = 'deployments-zk';
export const CHAIN_ID_FILE: string = '.chainId';

export async function saveCache(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    deployEntry: DeploymentEntry,
): Promise<void> {
    let deployment = await loadDeployment(hre, artifact);

    if (!deployment) {
        deployment = {
            sourceName: artifact.sourceName,
            contractName: artifact.contractName,
            abi: artifact.abi,
            bytecode: artifact.bytecode,
            entries: [],
        };
    }

    await addDeploymentEntry(hre, deployment, deployEntry);

    await saveDeployment(hre, deployment);
}

export async function loadCache(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    deploymentType: DeploymentType,
    constructorArgs: any[],
    salt: string,
    factoryDeps: string[],
): Promise<DeploymentEntry | undefined> {
    const deployment = await loadDeployment(hre, artifact);

    if (!deployment) {
        return undefined;
    }

    const entryToFind: EntryToFind = {
        constructorArgs,
        salt,
        deploymentType,
        factoryDeps,
    };

    return loadDeploymentEntry(hre, deployment, entryToFind);
}

export async function saveDeployment(hre: HardhatRuntimeEnvironment, deployment: Deployment): Promise<void> {
    const baseDir = path.join(hre.config.paths.root, DEPLOYMENT_PATH, hre.network.name);
    fse.mkdirpSync(baseDir);

    const chainId = await hre.network.provider.send('eth_chainId');

    const chainIdFile = path.join(baseDir, CHAIN_ID_FILE);
    fse.writeFileSync(chainIdFile, chainId);

    const contractDir = path.join(baseDir, deployment.sourceName);
    fse.mkdirpSync(contractDir);

    const deploymentFile = path.join(contractDir, `${deployment.contractName}.json`);
    fse.writeJsonSync(deploymentFile, deployment, { spaces: 2 });
}

export async function loadDeployment(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
): Promise<Deployment | undefined> {
    const baseDir = path.join(hre.config.paths.root, DEPLOYMENT_PATH, hre.network.name);

    const deploymentFile = path.join(baseDir, artifact.sourceName, `${artifact.contractName}.json`);

    if (!fse.existsSync(deploymentFile)) {
        return undefined;
    }

    const chainIdFile = path.join(baseDir, CHAIN_ID_FILE);
    const chainId = fse.readFileSync(chainIdFile, 'utf8');

    const currentChainId = await hre.network.provider.send('eth_chainId');

    if (chainId !== currentChainId) {
        return undefined;
    }

    const deployment: Deployment = fse.readJsonSync(deploymentFile);

    if (!lodash.isEqual(deployment.bytecode, artifact.bytecode)) {
        return undefined;
    }

    if (!lodash.isEqual(deployment.abi, artifact.abi)) {
        return undefined;
    }

    return deployment;
}

export async function addDeploymentEntry(
    hre: HardhatRuntimeEnvironment,
    deployment: Deployment,
    deploymentEntry: DeploymentEntry,
): Promise<void> {
    const existedEntry = await loadDeploymentEntry(hre, deployment, deploymentEntry);

    if (existedEntry) {
        return;
    }

    deployment.entries.push(deploymentEntry);
}

export async function loadDeploymentEntry(
    hre: HardhatRuntimeEnvironment,
    deployment: Deployment,
    deploymentForFound: DeploymentEntry | EntryToFind,
): Promise<DeploymentEntry | undefined> {
    const foundEntry = deployment.entries.find(
        (entry) =>
            lodash.isEqual(entry.constructorArgs, deploymentForFound.constructorArgs) &&
            lodash.isEqual(entry.salt, deploymentForFound.salt) &&
            lodash.isEqual(entry.deploymentType, deploymentForFound.deploymentType) &&
            lodash.isEqual(entry.factoryDeps.sort(), deploymentForFound.factoryDeps.sort()),
    );

    if (foundEntry) {
        const entryIndex = deployment.entries.indexOf(foundEntry);
        const retrievedContractBytecode = await retrieveContractBytecode(foundEntry.address, hre.network.provider);

        if (retrievedContractBytecode !== deployment.bytecode) {
            deployment.entries.splice(entryIndex, 1);
            await saveDeployment(hre, deployment);
            return undefined;
        }

        if (isDeploymentEntry(deploymentForFound)) {
            if (foundEntry.txHash !== deploymentForFound.txHash && deploymentForFound.address !== foundEntry.address) {
                const newEntry = { ...foundEntry };
                newEntry.txHash = deploymentForFound.txHash;
                newEntry.address = deploymentForFound.address;
                deployment.entries.splice(entryIndex, 1, newEntry);
            }
        }

        return foundEntry;
    }

    return undefined;
}

export function isDeploymentEntry(object: any): object is DeploymentEntry {
    return 'address' in object && 'txHash' in object;
}
