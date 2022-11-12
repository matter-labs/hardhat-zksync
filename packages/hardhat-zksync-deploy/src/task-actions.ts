import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import { callDeployScripts } from './plugin';

export async function zkSyncDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    hre.zksyncNetwork = taskArgs.zksyncNetwork || process.env.ZKSYNC_NETWORK;
    await callDeployScripts(hre, taskArgs.script);
}
