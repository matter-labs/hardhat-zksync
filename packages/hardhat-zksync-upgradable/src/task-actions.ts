import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import { Contract } from 'zksync-ethers';
import { deployBeacon, deployProxy, upgradeBeacon, upgradeProxy } from './plugin';

export async function deployZkSyncBeacon(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment,
): Promise<{
    proxy: Contract;
    beacon: Contract;
}> {
    return await deployBeacon(hre, taskArgs);
}

export async function deployZkSyncProxy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<Contract> {
    return await deployProxy(hre, taskArgs);
}

export async function upgradeZkSyncBeacon(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<Contract> {
    return await upgradeBeacon(hre, taskArgs);
}

export async function upgradeZkSyncProxy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<Contract> {
    return await upgradeProxy(hre, taskArgs);
}
