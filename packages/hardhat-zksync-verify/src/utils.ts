import axios from 'axios';
import exp from 'constants';
import { Artifacts } from 'hardhat/types';
import { isFullyQualifiedName } from 'hardhat/utils/contract-names';
import { VerificationStatusResponse } from './zksync-block-explorer/VerificationStatusResponse';
import { checkVerificationStatus } from './zksync-block-explorer/ZkSyncBlockExplorerService';
import { ZkSyncVerifyPluginError } from './zksync-verify-plugin-error';

export function handleAxiosError(error: any): never {
    if (axios.isAxiosError(error)) {
        throw new Error(
            `Axios error (code: ${error.code}) during the contract verification request\n Reason: ${error.response?.data}`
        );
    } else {
        throw new ZkSyncVerifyPluginError(`Failed to send contract verification request\n Reason: ${error}`);
    }
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function encodeArguments(abi: any, constructorArgs: any[]) {
    const { Interface } = await import('@ethersproject/abi');

    const contractInterface = new Interface(abi);
    let deployArgumentsEncoded;
    try {
        deployArgumentsEncoded = contractInterface.encodeDeploy(constructorArgs).replace('0x', '');
    } catch (error: any) {
        throw new ZkSyncVerifyPluginError(error.reason);
    }

    return deployArgumentsEncoded;
}

export async function executeVeificationWithRetry(
    requestId: string,
    verifyURL: string,
    maxRetries = 3,
    delayInMs = 1000
): Promise<VerificationStatusResponse> {
    let retries = 0;
    while (true) {
        const response = await checkVerificationStatus(requestId, verifyURL);
        if (response.isVerificationSuccess() || response.isVerificationFailure()) {
            return response;
        }
        retries += 1;
        if (retries > maxRetries) {
            throw new ZkSyncVerifyPluginError('Contract verification is still pending');
        }
        await delay(delayInMs);
    }
}

export async function checkContractName(artifacts: Artifacts, contractFQN: string) {
    if (contractFQN !== undefined) {
        if (!isFullyQualifiedName(contractFQN)) {
            throw new ZkSyncVerifyPluginError(
                `A valid fully qualified name was expected. Fully qualified names look like this: "contracts/AContract.sol:TheContract"
Instead, this name was received: ${contractFQN}`
            );
        }

        if (!(await artifacts.artifactExists(contractFQN))) {
            throw new ZkSyncVerifyPluginError(`The contract ${contractFQN} is not present in your project.`);
        }
    } else {
        throw new ZkSyncVerifyPluginError(
            `You did not provide any contract name. Please add fully qualified name of your contract. 
            Qualified names look like this: contracts/AContract.sol:TheContract`
        );
    }
}
