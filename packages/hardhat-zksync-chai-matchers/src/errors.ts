import { HardhatPluginError } from 'hardhat/plugins';

import { PLUGIN_NAME } from './constants';

export class ZkSyncChaiMatchersPluginError extends HardhatPluginError {
    constructor(encodedData: string, type: string, parentError?: Error) {
        const message = `There was an error decoding '${encodedData}' as a ${type}`;

        super(PLUGIN_NAME, message, parentError);
    }
}

export class ZkSyncChaiMatchersPluginDefaultError extends HardhatPluginError{
    constructor(message:string){
        super(PLUGIN_NAME,message)
    }
}

export class ZkSyncChaiMatchersPluginAssertionError extends HardhatPluginError {
    constructor(message: string) {
      super(PLUGIN_NAME,`Assertion error: ${message}`);
    }
}