import axios from 'axios';
import * as zk from 'zksync-ethers';
import { ZkSyncVerifyPluginError } from './errors';
import { WRONG_CONSTRUCTOR_ARGUMENTS } from './constants';

export function handleAxiosError(error: any): never {
    if (axios.isAxiosError(error)) {
        throw new Error(
            `Axios error (code: ${error.code}) during the contract verification request\n Reason: ${error.response?.data}`
        );
    } else {
        throw new ZkSyncVerifyPluginError(`Failed to send contract verification request\n Reason: ${error}`);
    }
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

export async function retrieveContractBytecode(address: string, hreNetwork: any): Promise<string> {
    const provider = new zk.Provider(hreNetwork.config.url);
    const bytecodeString = (await provider.send('eth_getCode', [address, 'latest'])) as string;

    if (bytecodeString.length === 0) {
        throw new ZkSyncVerifyPluginError(
            `The address ${address} has no bytecode. Is the contract deployed to this network?
  The selected network is ${hreNetwork.name}.`
        );
    }
    return bytecodeString;
}

export function parseWrongConstructorArgumentsError(string: string): string {
    // extract the values of the "types" and "values" keys from the string
    const data = JSON.parse(string.split('count=')[1].split(', value=')[0]);

    return `The number of constructor arguments you provided (${data['values']}) does not match the number of constructor arguments the contract has been deployed with (${data['types']}).`;
}

export function areSameBytecodes(
    deployedBytecode: string,
    runtimeBytecode: string
): boolean {
    if (deployedBytecode !== runtimeBytecode) {
        return false;
    }

    return true;
}
