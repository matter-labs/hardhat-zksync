import { NomicLabsHardhatPluginError } from 'hardhat/plugins';

// Returns a built plugin exception object.
export function pluginError(message: string): NomicLabsHardhatPluginError {
    return new NomicLabsHardhatPluginError('@matterlabs/hardhat-zksync-solc', message);
}
