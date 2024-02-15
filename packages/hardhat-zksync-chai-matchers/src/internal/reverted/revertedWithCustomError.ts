// eslint-disable-next-line @typescript-eslint/naming-convention
import EthersT, { toBeHex } from 'ethers';

import { AssertionError } from 'chai';

import { buildAssert, Ssfi } from '@nomicfoundation/hardhat-chai-matchers/utils';

import { assertIsNotNull, preventAsyncMatcherChaining } from '../utils';
import { REVERTED_WITH_CUSTOM_ERROR_MATCHER } from '../../constants';
import { decodeReturnData, getReturnDataFromError } from './utils';

export const REVERTED_WITH_CUSTOM_ERROR_CALLED = 'customErrorAssertionCalled';

interface CustomErrorAssertionData {
    contractInterface: EthersT.Interface;
    returnData: string;
    customError: EthersT.ErrorFragment;
}

export function supportRevertedWithCustomError(Assertion: Chai.AssertionStatic, chaiUtils: Chai.ChaiUtils) {
    Assertion.addMethod(
        REVERTED_WITH_CUSTOM_ERROR_MATCHER,
        function (this: any, contract: EthersT.BaseContract, expectedCustomErrorName: string) {
            const negated = this.__flags.negate;

            const { iface, expectedCustomError } = validateInput(this._obj, contract, expectedCustomErrorName);

            preventAsyncMatcherChaining(this, REVERTED_WITH_CUSTOM_ERROR_MATCHER, chaiUtils);

            const onSuccess = () => {
                const assert = buildAssert(negated, onSuccess);

                assert(
                    false,
                    `Expected transaction to be reverted with custom error '${expectedCustomErrorName}', but it didn't revert`,
                );
            };

            const onError = (error: any) => {
                const assert = buildAssert(negated, onError);

                const returnData = getReturnDataFromError(error);
                const decodedReturnData = decodeReturnData(returnData);

                if (decodedReturnData.kind === 'Empty') {
                    assert(
                        false,
                        `Expected transaction to be reverted with custom error '${expectedCustomErrorName}', but it reverted without a reason`,
                    );
                } else if (decodedReturnData.kind === 'Error') {
                    assert(
                        false,
                        `Expected transaction to be reverted with custom error '${expectedCustomErrorName}', but it reverted with reason '${decodedReturnData.reason}'`,
                    );
                } else if (decodedReturnData.kind === 'Panic') {
                    assert(
                        false,
                        `Expected transaction to be reverted with custom error '${expectedCustomErrorName}', but it reverted with panic code ${toBeHex(
                            decodedReturnData.code,
                        )} (${decodedReturnData.description})`,
                    );
                } else if (decodedReturnData.kind === 'Custom') {
                    if (decodedReturnData.id === expectedCustomError.selector) {
                        // add flag with the data needed for .withArgs
                        const customErrorAssertionData: CustomErrorAssertionData = {
                            contractInterface: iface,
                            customError: expectedCustomError,
                            returnData,
                        };
                        this.customErrorData = customErrorAssertionData;

                        assert(
                            true,
                            undefined,
                            `Expected transaction NOT to be reverted with custom error '${expectedCustomErrorName}', but it was`,
                        );
                    } else {
                        // try to decode the actual custom error
                        // this will only work when the error comes from the given contract
                        const actualCustomError = iface.getError(decodedReturnData.id);

                        if (actualCustomError === null) {
                            assert(
                                false,
                                `Expected transaction to be reverted with custom error '${expectedCustomErrorName}', but it reverted with a different custom error`,
                            );
                        } else {
                            assert(
                                false,
                                `Expected transaction to be reverted with custom error '${expectedCustomErrorName}', but it reverted with custom error '${actualCustomError.name}'`,
                            );
                        }
                    }
                } else {
                    const _exhaustiveCheck: never = decodedReturnData;
                }
            };

            const derivedPromise = Promise.resolve(this._obj).then(onSuccess, onError);

            // needed for .withArgs
            chaiUtils.flag(this, REVERTED_WITH_CUSTOM_ERROR_CALLED, true);
            this.promise = derivedPromise;

            this.then = derivedPromise.then.bind(derivedPromise);
            this.catch = derivedPromise.catch.bind(derivedPromise);

            return this;
        },
    );
}

export async function revertedWithCustomErrorWithArgs(
    context: any,
    Assertion: Chai.AssertionStatic,
    utils: Chai.ChaiUtils,
    expectedArgs: any[],
    ssfi: Ssfi,
) {
    const negated = false; // .withArgs cannot be negated
    const assert = buildAssert(negated, ssfi);

    const customErrorAssertionData: CustomErrorAssertionData = context.customErrorData;

    if (customErrorAssertionData === undefined) {
        throw new Error('[.withArgs] should never happen, please submit an issue to the Hardhat repository');
    }

    const { contractInterface, customError, returnData } = customErrorAssertionData;

    const errorFragment = contractInterface.getError(customError.name);
    assertIsNotNull(errorFragment, 'errorFragment');
    // We transform ether's Array-like object into an actual array as it's safer
    const actualArgs = resultToArray(contractInterface.decodeErrorResult(errorFragment, returnData));
    new Assertion(actualArgs).to.have.same.length(
        expectedArgs.length,
        `expected ${expectedArgs.length} args but got ${actualArgs.length}`,
    );

    for (const [i, actualArg] of actualArgs.entries()) {
        const expectedArg = expectedArgs[i];
        if (typeof expectedArg === 'function') {
            const errorPrefix = `The predicate for custom error argument with index ${i}`;
            try {
                assert(
                    expectedArg(actualArg),
                    `${errorPrefix} returned false`,
                    // no need for a negated message, since we disallow mixing .not. with
                    // .withArgs
                );
            } catch (e) {
                if (e instanceof AssertionError) {
                    assert(
                        false,
                        `${errorPrefix} threw an AssertionError: ${e.message}`,
                        // no need for a negated message, since we disallow mixing .not. with
                        // .withArgs
                    );
                }
                throw e;
            }
        } else if (Array.isArray(expectedArg)) {
            new Assertion(actualArg).to.deep.equal(expectedArg);
        } else {
            new Assertion(actualArg).to.equal(expectedArg);
        }
    }
}

interface CustomError {
    name: string;
    id: string;
    signature: string;
}

function _findCustomErrorByName(iface: any, name: string): CustomError | undefined {
    const ethers = require('ethers');

    const customErrorEntry = Object.entries(iface.errors).find(([, fragment]: any) => fragment.name === name);

    if (customErrorEntry === undefined) {
        return undefined;
    }

    const [customErrorSignature] = customErrorEntry;
    const customErrorId = ethers.utils.id(customErrorSignature).slice(0, 10);

    return {
        id: customErrorId,
        name,
        signature: customErrorSignature,
    };
}

function _findCustomErrorById(iface: any, id: string): CustomError | undefined {
    const ethers = require('ethers');

    const customErrorEntry: any = Object.entries(iface.errors).find(
        ([signature]: any) => ethers.utils.id(signature).slice(0, 10) === id,
    );

    if (customErrorEntry === undefined) {
        return undefined;
    }

    return {
        id,
        name: customErrorEntry[1].name,
        signature: customErrorEntry[0],
    };
}

function validateInput(
    obj: any,
    contract: EthersT.BaseContract,
    expectedCustomErrorName: string,
): { iface: EthersT.Interface; expectedCustomError: EthersT.ErrorFragment } {
    try {
        // check the case where users forget to pass the contract as the first
        // argument
        if (typeof contract === 'string' || contract?.interface === undefined) {
            // discard subject since it could potentially be a rejected promise
            throw new TypeError(
                'The first argument of .revertedWithCustomError must be the contract that defines the custom error',
            );
        }

        // validate custom error name
        if (typeof expectedCustomErrorName !== 'string') {
            throw new TypeError('Expected the custom error name to be a string');
        }

        const iface = contract.interface;
        const expectedCustomError = iface.getError(expectedCustomErrorName);

        // check that interface contains the given custom error
        if (expectedCustomError === null) {
            throw new Error(`The given contract doesn't have a custom error named '${expectedCustomErrorName}'`);
        }

        return { iface, expectedCustomError };
    } catch (e) {
        // if the input validation fails, we discard the subject since it could
        // potentially be a rejected promise
        Promise.resolve(obj).catch(() => {});
        throw e;
    }
}

export function resultToArray(result: EthersT.Result): any[] {
    return result.toArray().map((x) => (typeof x === 'object' && x !== null && 'toArray' in x ? resultToArray(x) : x));
}
