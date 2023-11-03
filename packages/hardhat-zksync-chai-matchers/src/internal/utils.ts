import { ZkSyncChaiMatchersPluginDefaultError, ZkSyncChaiMatchersPluginError } from "../errors";

export function assertIsNotNull<T>(
    value: T,
    valueName: string
  ): asserts value is Exclude<T, null> {
    if (value === null) {
      throw new ZkSyncChaiMatchersPluginDefaultError(
        `${valueName} should not be null`
      );
    }
  }