import { TASK_COMPILE_GET_COMPILATION_TASKS, TASK_COMPILE_SOLIDITY } from "hardhat/builtin-tasks/task-names";
import { extendConfig, subtask } from "hardhat/internal/core/config/config-env";

import { TASK_COMPILE_ZKSOLC } from "./task-names";
import "./type-extensions";

extendConfig((config) => {
  const defaultConfig = {
    version: "latest",
    compilerSource: "binary",
    settings: {
      optimizer: { 
        enabled: false,
      }
    }
  };
  config.zksolc = { ...defaultConfig, ...config.zksolc };
});

subtask(
  TASK_COMPILE_GET_COMPILATION_TASKS,
  async (_, __, runSuper): Promise<string[]> => {
    // Filter out task to compile solidity, as we replace it.
    const otherTasks = (await runSuper()).filter((task: string) => task !== TASK_COMPILE_SOLIDITY);

    return [...otherTasks, TASK_COMPILE_ZKSOLC];
  }
);

subtask(TASK_COMPILE_ZKSOLC, async (_, { config, artifacts }) => {
  const { compile } = await import("./compilation");

  // This plugin is experimental, so this task isn't split into multiple
  // subtasks yet.
  await compile(config.zksolc, config.paths, artifacts);
});
