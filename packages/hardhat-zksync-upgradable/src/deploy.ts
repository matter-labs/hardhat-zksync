import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import type { Deployment } from '@openzeppelin/upgrades-core';
import type { ethers } from 'ethers';
import { getContractAddress } from 'ethers/lib/utils';
import debug from 'debug';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

export interface DeployTransaction {
    deployTransaction: ethers.providers.TransactionResponse;
}

// export async function deploy(
//     artifact: ZkSyncArtifact,
//     deployer: Deployer,
//     deployData: any[]
// ): Promise<Required<Deployment & DeployTransaction>> {
//     const contractInstance = await deployer.deploy(artifact, deployData);
//     const { deployTransaction } = contractInstance;

//     const address: string = getContractAddress({
//         from: await deployer.zkWallet.getAddress(),
//         nonce: deployTransaction.nonce,
//     });
//     if (address !== contractInstance.address) {
//         debug(
//             `overriding contract address from ${contractInstance.address} to ${address} for nonce ${deployTransaction.nonce}`
//         );
//     }

//     const txHash = deployTransaction.hash;
//     return { address, txHash, deployTransaction };
// }

export async function deploy(
    deployer: Deployer,
    artifact: ZkSyncArtifact,
    ...args: any[]
): Promise<Required<Deployment & DeployTransaction>> {
    const contractInstance = await deployer.deploy(artifact, ...args);
    const { deployTransaction } = contractInstance;

    // const address: string = getContractAddress({
    //     from: await deployer.zkWallet.getAddress(),
    //     nonce: deployTransaction.nonce,
    // });

    // TODO: Check this override
    // if (address !== contractInstance.address) {
    //     debug(
    //         `overriding contract address from ${contractInstance.address} to ${address} for nonce ${deployTransaction.nonce}`
    //     );
    // }

    const address = contractInstance.address;
    const txHash = deployTransaction.hash;
    return { address, txHash, deployTransaction };
}
