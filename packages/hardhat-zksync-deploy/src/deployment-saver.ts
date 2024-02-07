import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import { ZkSyncArtifact } from './types';
import * as fse from 'fs-extra';
import path from 'path';
import lodash from 'lodash';

export interface Deployment {
    contractName: string;
    abi: {};
    bytecode: string;
    address: string;
}

export const DEPLOYMENT_PATH : string = 'deployments';
export const CHAIN_ID_FILE : string = '.chainId';

export async function saveDeployment(hre: HardhatRuntimeEnvironment, contract: zk.Contract, artifact: ZkSyncArtifact): Promise<void> {
    const deployment: Deployment = {
        contractName: artifact.contractName,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        address: await contract.getAddress(),
    };

    const baseDir = path.join(hre.config.paths.root, DEPLOYMENT_PATH, hre.network.name);
    fse.mkdirpSync(baseDir);

    const chainId = await hre.network.provider.send('eth_chainId');

    const chainIdFile = path.join(baseDir, CHAIN_ID_FILE);
    fse.writeFileSync(chainIdFile, chainId);

    const deploymentFile = path.join(baseDir, `${artifact.contractName}.json`);
    fse.writeJsonSync(deploymentFile, deployment, { spaces: 2 });
}

export async function loadDeployment(hre: HardhatRuntimeEnvironment, artifact: ZkSyncArtifact): Promise<Deployment | undefined> {
    const baseDir = path.join(hre.config.paths.root, DEPLOYMENT_PATH, hre.network.name);
    const deploymentFile = path.join(baseDir, `${artifact.contractName}.json`);

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

    if(!lodash.isEqual(deployment.abi, artifact.abi)) {
        return undefined;
    }

    return deployment;
}
