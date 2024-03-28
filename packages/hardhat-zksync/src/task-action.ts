import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import { deployWithOneLineAndVerify } from './plugin';

export async function deployZkSyncWithOneLineAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    await deployWithOneLineAndVerify(hre, runSuper, taskArgs);
}
