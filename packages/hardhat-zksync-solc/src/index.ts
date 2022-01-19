import {
  TASK_COMPILE_SOLIDITY_RUN_SOLC,
  TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT
} from "hardhat/builtin-tasks/task-names";
import { extendConfig, subtask } from "hardhat/internal/core/config/config-env";
import { CompilerInput } from "hardhat/types";
import "./type-extensions";
import { ZkSyncArtifact } from './types';
import { ARTIFACT_FORMAT_VERSION, compile } from './compilation';

extendConfig((config) => {
  const defaultConfig = {
    version: "latest",
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: false,
      },
    },
    experimental: {
      dockerImage: null,
    }
  };
  config.zksolc = { ...defaultConfig, ...config.zksolc };
});

subtask(TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT, 
    async ({
      sourceName,
      contractName,
      contractOutput,
    }: {
      sourceName: string;
      contractName: string;
      contractOutput: any;
    }): Promise<ZkSyncArtifact> => {

  let bytecode: string = contractOutput.evm?.bytecode?.object || 
      contractOutput.evm?.deployedBytecode?.object || "";

  if (bytecode.slice(0, 2).toLowerCase() !== "0x") {
    bytecode = `0x${bytecode}`;
  }

  return {
    _format: ARTIFACT_FORMAT_VERSION,
    contractName,
    sourceName,
    abi: contractOutput.abi,
    // technically, zkEVM has no difference between bytecode & deployedBytecode,
    // but both fields are included just in case
    bytecode,
    deployedBytecode: bytecode,
    linkReferences: {},
    deployedLinkReferences: {},

    // zkSync-specific field
    factoryDeps: contractOutput.factoryDependencies, // TODO: normalize factory deps
  };
})

// TODO: run prettier
// TODO: if solidity optimizer is not enabled, we have to manually pass libraries (verify)
subtask(TASK_COMPILE_SOLIDITY_RUN_SOLC, async ({ input }: { input: CompilerInput }, { config }) => {
  // TODO: fix docker compilation
  // This plugin is experimental, so this task isn't split into multiple
  // subtasks yet.
  return await compile(config.zksolc, input);
});
