import type { BigNumber } from 'ethers';
import { AssertionError } from 'chai';

import { panicErrorCodeToReason } from '@nomicfoundation/hardhat-chai-matchers/internal/reverted/panic';

import { ZkSyncChaiMatchersPluginError } from '../../errors';

// method id of 'Error(string)'
const ERROR_STRING_PREFIX = '0x08c379a0';

// method id of 'Panic(uint256)'
const PANIC_CODE_PREFIX = '0x4e487b71';

export function getReturnDataFromError(error: any): string {
    if (!(error instanceof Error)) {
        throw new AssertionError('Expected an Error object');
    }

    // cast to any again so we don't have to cast it every time we access
    // some property that doesn't exist on Error
    error = error as any;

    const returnData = error.error?.error?.data?.message;

    if (returnData === undefined || typeof returnData !== 'string') {
        throw error;
    }

    return returnData;
}

type DecodedReturnData =
    | {
          kind: 'Error';
          reason: string;
      }
    | {
          kind: 'Empty';
      }
    | {
          kind: 'Panic';
          code: BigNumber;
          description: string;
      }
    | {
          kind: 'Custom';
          id: string;
          data: string;
      };

type FuncSelectorWithData = {
    funcSelector: string;
    data: string;
};

export function getFuncSelectorWithData(message: string): FuncSelectorWithData {
    const extracted = message.match(/0x\w*/g);

    if (extracted == null || !message.includes('Error function_selector')) {
        // Remove dot at the end of the reason
        message = message.substring(0, message.length - 1);
        // Remove substring: `Cannot estimate transaction: `
        const reason = message.substring(29);

        return {
            funcSelector: ERROR_STRING_PREFIX,
            data: reason,
        };
    }

    return {
        funcSelector: extracted[0],
        data: extracted[1],
    };
}

export function encodeFuncSelectorWithData(message: string): string {
    let { funcSelector, data } = getFuncSelectorWithData(message);

    if (funcSelector === ERROR_STRING_PREFIX) {
        const { defaultAbiCoder: abi } = require('@ethersproject/abi');

        data = abi.encode(['string'], [data]);
    }

    if (data.startsWith('0x')) {
        data = data.slice('0x'.length);
    }

    return funcSelector + data;
}

export function decodeReturnData(returnData: string): DecodedReturnData {
    const { funcSelector, data } = getFuncSelectorWithData(returnData);

    if (funcSelector === '0x') {
        return {
            kind: 'Empty',
        };
    } else if (funcSelector === ERROR_STRING_PREFIX) {
        return {
            kind: 'Error',
            reason: data,
        };
    } else if (funcSelector === PANIC_CODE_PREFIX) {
        const { defaultAbiCoder: abi } = require('@ethersproject/abi');
        let code: BigNumber;
        try {
            code = abi.decode(['uint256'], data)[0];
        } catch (e: any) {
            throw new ZkSyncChaiMatchersPluginError(data, 'uint256', e);
        }

        const description = panicErrorCodeToReason(code) ?? 'unknown panic code';

        return {
            kind: 'Panic',
            code,
            description,
        };
    }

    return {
        kind: 'Custom',
        id: funcSelector,
        data: data,
    };
}
