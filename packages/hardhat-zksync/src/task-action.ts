import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import {
    deployContractAndVerify,
    deployBeaconAndVerify,
    deployProxyAndVerify,
    upgradeBeaconAndVerify,
    upgradeProxyAndVerify,
} from './plugin';

export async function deployZkSyncContractAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await deployContractAndVerify(hre, runSuper, taskArgs);
}

export async function deployZkSyncBeaconAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await deployBeaconAndVerify(hre, runSuper, taskArgs);
}

export async function deployZkSyncProxyAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await deployProxyAndVerify(hre, runSuper, taskArgs);
}

export async function upgradeZkSyncBeaconAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await upgradeBeaconAndVerify(hre, runSuper, taskArgs);
}

export async function upgradeZkSyncProxyAndVerify(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    return await upgradeProxyAndVerify(hre, runSuper, taskArgs);
}
