import { HardhatPluginError } from 'hardhat/plugins';
import { PLUGIN_NAME } from './constants'

export class ZkSyncWeb3PluginError extends HardhatPluginError {
  constructor(message: string, parentError?: Error) {
      super(PLUGIN_NAME, message, parentError);
  }
}
