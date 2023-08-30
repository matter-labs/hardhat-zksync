import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import { callDeployScripts, deployLibraries} from './plugin';

export async function zkSyncDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    await callDeployScripts(hre, taskArgs.script);
}

export async function zkSyncLibraryDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    await deployLibraries(hre, taskArgs.privateKey, taskArgs.accountNumber, taskArgs.externalConfigObjectPath, taskArgs.exportedConfigObject, taskArgs.noAutoPopulateConfig, taskArgs.compileAllContracts);
}
