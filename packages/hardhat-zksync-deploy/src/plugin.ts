import { existsSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as path from "path";
import * as glob from "glob";

import { pluginError } from "./helpers";

export function findDeployScripts(hre: HardhatRuntimeEnvironment): string[] {
  const workDir = hre.config.paths.root;
  const deployScriptsDir = path.join(workDir, "deploy");

  if (!existsSync(deployScriptsDir)) {
    throw pluginError("No deploy folder was found");
  }

  const tsFiles = glob.sync(path.join(deployScriptsDir, "**", "*.ts"));

  return tsFiles;
}

export async function callDeployScripts(hre: HardhatRuntimeEnvironment) {
  const scripts = findDeployScripts(hre);

  for (const script of scripts) {
    const deployFn = require(script).default;

    await deployFn(hre);
  }
}
