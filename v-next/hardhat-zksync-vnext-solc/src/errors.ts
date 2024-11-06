import { HardhatPluginError } from "@ignored/hardhat-vnext/plugins";
import { PLUGIN_NAME } from "./constants.js";

export class ZkSyncSolcPluginError extends HardhatPluginError {
    constructor(message: string, parentError?: Error) {
        super(PLUGIN_NAME, message, parentError);
    }
}
