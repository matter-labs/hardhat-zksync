import { buildAssert } from '@nomicfoundation/hardhat-chai-matchers/utils';
import { REVERTED_WITH_MATCHER } from '../../constants';
import { preventAsyncMatcherChaining } from '../utils';
import { decodeReturnData, getReturnDataFromError } from './utils';

export function supportRevertedWith(Assertion: Chai.AssertionStatic, chaiUtils: Chai.ChaiUtils) {
    Assertion.addMethod(REVERTED_WITH_MATCHER, function (this: any, expectedReason: string | RegExp) {
        const negated = this.__flags.negate;

        if (!(expectedReason instanceof RegExp) && typeof expectedReason !== 'string') {
            throw new TypeError('Expected the revert reason to be a string or a regular expression');
        }

        const expectedReasonString = expectedReason instanceof RegExp ? expectedReason.source : expectedReason;

        preventAsyncMatcherChaining(this, REVERTED_WITH_MATCHER, chaiUtils);

        const onSuccess = () => {
            const assert = buildAssert(negated, onSuccess);

            assert(
                false,
                `Expected transaction to be reverted with reason '${expectedReasonString}', but it didn't revert`,
            );
        };

        const onError = (error: any) => {
            const assert = buildAssert(negated, onError);

            const returnData = getReturnDataFromError(error);
            const decodedReturnData = decodeReturnData(returnData);

            if (decodedReturnData.kind === 'Empty') {
                assert(
                    false,
                    `Expected transaction to be reverted with reason '${expectedReasonString}', but it reverted without a reason`,
                );
            } else if (decodedReturnData.kind === 'Error') {
                const isReverted =
                    expectedReason instanceof RegExp
                        ? expectedReason.test(decodedReturnData.reason)
                        : decodedReturnData.reason === expectedReasonString;
                assert(
                    isReverted,
                    `Expected transaction to be reverted with reason '${expectedReasonString}', but it reverted with reason '${decodedReturnData.reason}'`,
                    `Expected transaction NOT to be reverted with reason '${expectedReasonString}', but it was`,
                );
            } else if (decodedReturnData.kind === 'Panic') {
                assert(
                    false,
                    `Expected transaction to be reverted with reason '${expectedReasonString}', but it reverted with panic code ${decodedReturnData.code.toHexString()} (${
                        decodedReturnData.description
                    })`,
                );
            } else if (decodedReturnData.kind === 'Custom') {
                assert(
                    false,
                    `Expected transaction to be reverted with reason '${expectedReasonString}', but it reverted with a custom error`,
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
