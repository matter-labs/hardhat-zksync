import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import { Contract } from 'zksync-ethers';
import { deployContract, deployLibraries } from './plugin';
import { ScriptManager } from './script-manager';

export async function zkSyncDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    let tags = taskArgs.tags;
    if (typeof tags === 'string') {
        tags = tags.split(',');
    }

    const scriptManager = new ScriptManager(hre);

    await scriptManager.callDeployScripts(taskArgs.script, tags);
}

export async function zkSyncLibraryDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    await deployLibraries(
        hre,
        taskArgs.privateKeyOrIndex,
        taskArgs.externalConfigObjectPath,
        taskArgs.exportedConfigObject,
        taskArgs.noAutoPopulateConfig,
        taskArgs.compileAllContracts,
    );
}

export async function deployZkSyncContract(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<Contract> {
    return await deployContract(hre, taskArgs);
}
