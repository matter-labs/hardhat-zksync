import { extendConfig, task } from "hardhat/config";

import { TASK_DEPLOY_ZKSYNC } from "./task-names";
import "./type-extensions";
import { callDeployScripts } from "./plugin";

export * from "./deployer";

extendConfig((config) => {
  const defaultConfig = {
    zkSyncRpc: "unknown",
    l1Network: "unknown",
  };
  config.zkSyncDeploy = { ...defaultConfig, ...config.zkSyncDeploy };
});

task(
  TASK_DEPLOY_ZKSYNC,
  "Runs the deploy scripts for zkSync network",
  async function (taskArguments, hre) {
    // TODO: Which task arguments do we need? For example, the exact script to run?
    await callDeployScripts(hre);
  }
);
