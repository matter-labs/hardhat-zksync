import type { Deployment } from '@openzeppelin/upgrades-core';
import { ContractFactory } from 'zksync-web3';
import * as ethers from 'ethers';

export interface DeployTransaction {
    deployTransaction: ethers.providers.TransactionResponse;
}

export async function deploy(
    factory: ContractFactory,
    ...args: any[]
): Promise<Required<Deployment & DeployTransaction>> {
    const contractInstance = await factory.deploy(...args);
    const { deployTransaction } = contractInstance;

    const address = contractInstance.address;
    const txHash = deployTransaction.hash;
    return { address, txHash, deployTransaction };
}
