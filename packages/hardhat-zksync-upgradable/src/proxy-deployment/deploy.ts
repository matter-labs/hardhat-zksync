import type { Deployment, RemoteDeploymentId } from '@openzeppelin/upgrades-core';
import { ContractFactory } from 'zksync-ethers';
import * as ethers from 'ethers';

export interface DeployTransaction {
    deployTransaction: ethers.TransactionResponse;
}

export async function deploy(
    factory: ContractFactory,
    ...args: any[]
): Promise<Required<Deployment & DeployTransaction> & RemoteDeploymentId> {
    const contractInstance = await factory.deploy(...args);

    const deploymentTransaction = contractInstance.deploymentTransaction();

    const deployTransaction = contractInstance.deploymentTransaction();
    if (deployTransaction === null) {
        throw new Error('Broken invariant: deploymentTransaction is null');
    }

    const address = await contractInstance.getAddress();
    const txHash = deploymentTransaction!.hash;

    return { address, txHash, deployTransaction };
}
