import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import { callDeployScripts } from './plugin';

export async function zkSyncDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    await callDeployScripts(hre, taskArgs.script);
}
