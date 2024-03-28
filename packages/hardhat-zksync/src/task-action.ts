import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import {
    deployBeaconWithOneLineAndVerify,
    deployProxyWithOneLineAndVerify,
    deployWithOneLineAndVerify,
    upgradeBeaconWithOneLineAndVerify,
    upgradeProxyWithOneLineAndVerify,
} from './plugin';

export async function deployZkSyncWithOneLineAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await deployWithOneLineAndVerify(hre, runSuper, taskArgs);
}

export async function deployBeaconZkSyncWithOneLineAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await deployBeaconWithOneLineAndVerify(hre, runSuper, taskArgs);
}

export async function deployProxyZkSyncWithOneLineAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await deployProxyWithOneLineAndVerify(hre, runSuper, taskArgs);
}

export async function upgradeBeaconZkSyncWithOneLineAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await upgradeBeaconWithOneLineAndVerify(hre, runSuper, taskArgs);
}

export async function upgradeProxyZkSyncWithOneLineAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await upgradeProxyWithOneLineAndVerify(hre, runSuper, taskArgs);
}
