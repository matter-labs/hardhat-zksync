import { spawnSync } from "child_process";
import { ZkSolcConfig } from "../types";
import { pluginError } from "../utils";

// Checks whether `zksolc` is available in `$PATH`.
export function checkZksolcBinary() {
  const inPath = spawnSync("which", ["zksolc"]).status === 0;
  if (!inPath) {
    throw pluginError(
      "`zksolc` binary is either not installed or not in $PATH"
    );
  }
}

export function compileWithBinary(filePath: string, config: ZkSolcConfig): any {
  const zksolcArguments = [filePath, "--combined-json", "abi,bin,bin-runtime"];
  if (config.settings.optimizer.enabled) {
    zksolcArguments.push("--optimize");
  }

  return spawnSync("zksolc", zksolcArguments);
}
