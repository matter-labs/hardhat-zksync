import { ZkSyncChaiMatchersPluginError } from "../errors";

export function assertIsNotNull<T>(
    value: T,
    valueName: string
  ): asserts value is Exclude<T, null> {
    if (value === null) {
        //TODO
      throw new Error(
        `${valueName} should not be null`
      );
    }
  }