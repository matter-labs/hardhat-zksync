import { normalizeToBigInt } from 'hardhat/common';
import { panicErrorCodeToReason } from '@nomicfoundation/hardhat-chai-matchers/internal/reverted/panic';
import { buildAssert } from '@nomicfoundation/hardhat-chai-matchers/utils';

import { decodeReturnData, getReturnDataFromError } from './utils';
import { toBeHex } from 'ethers';

export function supportRevertedWithPanic(Assertion: Chai.AssertionStatic) {
    Assertion.addMethod('revertedWithPanic', function (this: any, expectedCodeArg: any) {
        const negated = this.__flags.negate;

        let expectedCode: bigint | undefined;
        try {
            if (expectedCodeArg !== undefined) {
                expectedCode = normalizeToBigInt(expectedCodeArg);
            }
        } catch {
            throw new TypeError(
                `Expected the given panic code to be a number-like value, but got '${expectedCodeArg}'`
            );
        }

        const code: bigint | undefined = expectedCode;

        let description: string | undefined;
        let formattedPanicCode: string;
        if (code === undefined) {
            formattedPanicCode = 'some panic code';
        } else {
            const codeBN = code;
            description = panicErrorCodeToReason(codeBN) ?? 'unknown panic code';
            formattedPanicCode = `panic code ${toBeHex(codeBN)} (${description})`;
        }

        const onSuccess = () => {
            const assert = buildAssert(negated, onSuccess);

            assert(false, `Expected transaction to be reverted with ${formattedPanicCode}, but it didn't revert`);
        };

        const onError = (error: any) => {
            const assert = buildAssert(negated, onError);

            const returnData = getReturnDataFromError(error);
            const decodedReturnData = decodeReturnData(returnData);

            if (decodedReturnData.kind === 'Empty') {
                assert(
                    false,
                    `Expected transaction to be reverted with ${formattedPanicCode}, but it reverted without a reason`
                );
            } else if (decodedReturnData.kind === 'Error') {
                assert(
                    false,
                    `Expected transaction to be reverted with ${formattedPanicCode}, but it reverted with reason '${decodedReturnData.reason}'`
                );
            } else if (decodedReturnData.kind === 'Panic') {
                if (code !== undefined) {
                    assert(
                        decodedReturnData.code===(code),
                        `Expected transaction to be reverted with ${formattedPanicCode}, but it reverted with panic code ${toBeHex(decodedReturnData.code)} (${
                            decodedReturnData.description
                        })`,
                        `Expected transaction NOT to be reverted with ${formattedPanicCode}, but it was`
                    );
                } else {
                    assert(
                        true,
                        undefined,
                        `Expected transaction NOT to be reverted with ${formattedPanicCode}, but it reverted with panic code ${toBeHex(decodedReturnData.code)} (${
                            decodedReturnData.description
                        })`
                    );
                }
            } else if (decodedReturnData.kind === 'Custom') {
                assert(
                    false,
                    `Expected transaction to be reverted with ${formattedPanicCode}, but it reverted with a custom error`
                );
            } else {
                const _exhaustiveCheck: never = decodedReturnData;
            }
        };

        const derivedPromise = Promise.resolve(this._obj).then(onSuccess, onError);

        this.then = derivedPromise.then.bind(derivedPromise);
        this.catch = derivedPromise.catch.bind(derivedPromise);

        return this;
    });
}
