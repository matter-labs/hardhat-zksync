import axios from 'axios';
import * as zk from 'zksync-web3';
import { VerificationStatusResponse } from './zksync-block-explorer/verification-status-response';
import { checkVerificationStatusService } from './zksync-block-explorer/service';
import { ZkSyncVerifyPluginError } from './errors';
import { PENDING_CONTRACT_INFORMATION_MESSAGE, WRONG_CONSTRUCTOR_ARGUMENTS } from './constants';
import chalk from 'chalk';

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
        const errorMessage = error.message.includes(WRONG_CONSTRUCTOR_ARGUMENTS)
            ? parseWrongConstructorArgumentsError(error.message)
            : error.message;

        throw new ZkSyncVerifyPluginError(errorMessage);
    }

    return deployArgumentsEncoded;
}

export async function executeVeificationWithRetry(
    requestId: number,
    verifyURL: string,
    maxRetries = 5,
    delayInMs = 1500
): Promise<VerificationStatusResponse | undefined> {
    let retries = 0;

    while (true) {
        const response = await checkVerificationStatusService(requestId, verifyURL);
        if (response.isVerificationSuccess() || response.isVerificationFailure()) {
            return response;
        }
        retries += 1;
        if (retries > maxRetries) {
            console.info(chalk.cyan(PENDING_CONTRACT_INFORMATION_MESSAGE(requestId)));
            return;
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

export function removeMultipleSubstringOccurrences(inputString: string, stringToRemove: string): string {
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

export function parseWrongConstructorArgumentsError(string: string): string {
    // extract the values of the "types" and "values" keys from the string
    const data = JSON.parse(string.split('count=')[1].split(', value=')[0]);

    return `The number of constructor arguments you provided (${data['values']}) does not match the number of constructor arguments the contract has been deployed with (${data['types']}).`;
}
