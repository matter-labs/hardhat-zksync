import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { resetHardhatContext } from "hardhat/plugins-testing";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";

declare module "mocha" {
  interface Context {
    env: HardhatRuntimeEnvironment;
  }
}

export function useEnvironment(fixtureProjectName: string,networkName: string = "hardhat") {
  before("Loading hardhat environment", async function () {
    process.chdir(path.join(__dirname, "fixture-projects", fixtureProjectName));
    process.env.HARDHAT_NETWORK = networkName;
    this.env = require("hardhat");
    await this.env.run(TASK_COMPILE);
  });

  after("Resetting hardhat context", function () {
    resetHardhatContext();
  });
};
