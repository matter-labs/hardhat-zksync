import { ASYNC_MATCHER_CALLED } from '../constants';
import { ZkSyncChaiMatchersNonChainableMatcherError, ZkSyncChaiMatchersPluginDefaultError } from '../errors';

export function assertIsNotNull<T>(value: T, valueName: string): asserts value is Exclude<T, null> {
    if (value === null) {
        throw new ZkSyncChaiMatchersPluginDefaultError(`${valueName} should not be null`);
    }
}

export function preventAsyncMatcherChaining(
    context: object,
    matcherName: string,
    chaiUtils: Chai.ChaiUtils
  ) {
    if (chaiUtils.flag(context, ASYNC_MATCHER_CALLED) === true) {
      throw new ZkSyncChaiMatchersNonChainableMatcherError(matcherName);
    }
    chaiUtils.flag(context, ASYNC_MATCHER_CALLED, true);
}