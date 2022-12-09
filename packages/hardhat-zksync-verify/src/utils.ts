import axios from 'axios';
import * as zk from 'zksync-web3';
import { VerificationStatusResponse } from './zksync-block-explorer/VerificationStatusResponse';
import { checkVerificationStatus } from './zksync-block-explorer/ZkSyncBlockExplorerService';
import { ZkSyncVerifyPluginError } from './errors';

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
        throw new ZkSyncVerifyPluginError(error.message);
    }

    return deployArgumentsEncoded;
}

export async function executeVeificationWithRetry(
    requestId: string,
    verifyURL: string,
    maxRetries = 5,
    delayInMs = 1500
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

export async function retrieveContractBytecode(address: string, hreNetwork: any): Promise<string> {
    const provider = new zk.Provider(hreNetwork.config.url);
    const bytecodeString = (await provider.send('eth_getCode', [address, 'latest'])) as string;
    const deployedBytecode = bytecodeString.startsWith('0x') ? bytecodeString.slice(2) : bytecodeString;
    if (deployedBytecode.length === 0) {
        throw new ZkSyncVerifyPluginError(
            `The address ${address} has no bytecode. Is the contract deployed to this network?
  The selected network is ${hreNetwork.name}.`
        );
    }
    return deployedBytecode;
}

export function removeDuplicateLicenseIdentifiers(inputString: string, stringToRemove: string): string {
    const lines = inputString.split('\n');
    let output = '';
    let firstIdentifierFound = false;

    for (const line of lines) {
        if (line.trim().includes(stringToRemove)) {
            if (!firstIdentifierFound) {
                output += line + '\n';
                firstIdentifierFound = true;
            }
        } else {
            output += line + '\n';
        }
    }

    return output.trim();
}
