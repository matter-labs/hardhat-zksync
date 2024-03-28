import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import { Contract } from 'zksync-ethers';
import {
    deployBeaconWithOneLine,
    deployProxyWithOneLine,
    upgradeBeaconWithOneLine,
    upgradeProxyWithOneLine,
} from './plugin';

export async function deployBeaconZkSyncWithOneLine(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
): Promise<{
    proxy: Contract;
    beacon: Contract;
}> {
    return await deployBeaconWithOneLine(hre, taskArgs);
}

export async function deployProxyZkSyncWithOneLine(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
): Promise<Contract> {
    return await deployProxyWithOneLine(hre, taskArgs);
}

export async function upgradeBeaconZkSyncWithOneLine(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
): Promise<Contract> {
    return await upgradeBeaconWithOneLine(hre, taskArgs);
}

export async function upgradeProxyZkSyncWithOneLine(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
): Promise<Contract> {
    return await upgradeProxyWithOneLine(hre, taskArgs);
}
