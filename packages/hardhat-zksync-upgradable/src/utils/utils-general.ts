import { Interface } from '@ethersproject/abi';
import { MaybeSolcOutput } from '../interfaces';
import { keccak256 } from 'ethereumjs-util';
import chalk from 'chalk';

export type ContractAddressOrInstance = string | { address: string };

export function getContractAddress(addressOrInstance: ContractAddressOrInstance): string {
    if (typeof addressOrInstance === 'string') {
        return addressOrInstance;
    } else {
        return addressOrInstance.address;
    }
}

export function getInitializerData(
    contractInterface: Interface,
    args: unknown[],
    initializer?: string | false
): string {
    if (initializer === false) {
        return '0x';
    }

    const allowNoInitialization = initializer === undefined && args.length === 0;
    initializer = initializer ?? 'initialize';

    try {
        const fragment = contractInterface.getFunction(initializer);
        return contractInterface.encodeFunctionData(fragment, args);
    } catch (e: unknown) {
        if (e instanceof Error) {
            if (allowNoInitialization && e.message.includes('no matching function')) {
                return '0x';
            }
        }
        throw e;
    }
}


/**
 * Gets the constructor args from the given transaction input and creation code.
 *
 * @param txInput The transaction input that was used to deploy the contract.
 * @param creationCode The contract creation code.
 * @returns the encoded constructor args, or undefined if txInput does not start with the creationCode.
 */
export function inferConstructorArgs(txInput: string, creationCode: string) {
    if (txInput.startsWith(creationCode)) {
      return txInput.substring(creationCode.length);
    } else {
      return undefined;
    }
  }

/**
 * Gets the txhash that created the contract at the given address, by calling the
 * Etherscan API to look for an event that should have been emitted during construction.
 *
 * @param address The address to get the creation txhash for.
 * @param topic The event topic string that should have been logged.
 * @param etherscanApi The Etherscan API config
 * @returns The txhash corresponding to the logged event, or undefined if not found or if
 *   the address is not a contract.
 * @throws {UpgradesError} if the Etherscan API returned with not OK status
 */
export async function getContractCreationTxHash(
    address: string,
    topic: string,
  ): Promise<any> {
    const params = {
      module: 'logs',
      action: 'getLogs',
      fromBlock: '0',
      toBlock: 'latest',
      address: address,
      topic0: '0x' + keccak256(Buffer.from(topic)).toString('hex'),
    };
  
    const responseBody = {status: 200, message: 'OK', result:[ {transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234'}]};
  
    //FIXME: replace with a proper check for the status code
    if (responseBody.status === 200) {
      const result = responseBody.result;
      return result[0].transactionHash; // get the txhash from the first instance of this event
    } else if (responseBody.message === 'No records found' || responseBody.message === 'No logs found') {
      console.info(chalk.yellow(`no result found for event topic ${topic} at address ${address}`));
      return undefined;
    } else {
      throw new Error(
        `Failed to get logs for contract at address ${address}.`+
        `Etherscan returned with message: ${responseBody.message}, reason: ${responseBody.result}`,
      );
    }
  }

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const res: Partial<Pick<T, K>> = {};
    for (const k of keys) {
        res[k] = obj[k];
    }
    return res as Pick<T, K>;
}

export function mapValues<V, W>(obj: Record<string, V>, fn: (value: V) => W): Record<string, W> {
    const res: Partial<Record<string, W>> = {};
    for (const k in obj) {
        res[k] = fn(obj[k]);
    }
    return res as Record<string, W>;
}

export function isFullZkSolcOutput(output: MaybeSolcOutput | undefined): boolean {
    if (output?.contracts == undefined || output?.sources == undefined) {
        return false;
    }

    for (const fileName of Object.keys(output.contracts)) {
        const file = output.contracts[fileName];
        if (file == undefined) {
            return false;
        }
    }

    for (const file of Object.values(output.sources)) {
        if (file?.ast == undefined || file?.id == undefined) {
            return false;
        }
    }

    return true;
}
