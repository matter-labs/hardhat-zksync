import { NomicLabsHardhatPluginError } from "hardhat/plugins";

export function add0xPrefixIfNecessary(hex: string): string {
  hex = hex.toLowerCase();

  if (hex.slice(0, 2) === "0x") {
    return hex;
  }

  return `0x${hex}`;
}

// Returns a built plugin exception object.
export function pluginError(message: string, parent?: any): NomicLabsHardhatPluginError {
  return new NomicLabsHardhatPluginError(
    "@matterlabs/hardhat-zksync-solc",
    message,
    parent
  );
}
