import { HardhatPluginError } from 'hardhat/plugins';
import { PLUGIN_NAME } from './constants';

export class ZkSyncUpgradablePluginError extends HardhatPluginError {
    constructor(message: string, parentError?: Error) {
        super(PLUGIN_NAME, message, parentError);
    }
}
