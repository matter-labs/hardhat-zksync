import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import { Contract } from 'zksync-ethers';
import { deployContract, deployLibraries } from './plugin';
import { ScriptManager } from './script-manager';
import { waitForNodeToBeReady, startServer } from '@matterlabs/hardhat-zksync-node/src/utils';
import { JsonRpcServer } from '@matterlabs/hardhat-zksync-node/src/server';

async function withEraTestNode(hre: HardhatRuntimeEnvironment, taskLogic: () => Promise<void>) {
    let eraTestNode: JsonRpcServer | undefined;
    if (hre.network.zksync && hre.network.name === 'hardhat') {
        try {
            const { commandArgs, server, port } = await startServer();
            eraTestNode = server;
            const _ = eraTestNode!.listen(commandArgs);
            await waitForNodeToBeReady(port);
        } catch (e) {
            if (eraTestNode) {
                const _ = eraTestNode.stop();
            }
            throw new Error(`Could not start Era Test Node: ${e}`);
        }
    }

    try {
        await taskLogic();
    } finally {
        if (eraTestNode) {
            const _ = eraTestNode.stop();
        }
    }
}

export async function zkSyncDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    await withEraTestNode(hre, async () => {
        let tags = taskArgs.tags;
        if (typeof tags === 'string') {
            tags = tags.split(',');
        }

        const scriptManager = new ScriptManager(hre);
        await scriptManager.callDeployScripts(taskArgs.script, tags);
    });
}

export async function zkSyncLibraryDeploy(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) {
    await withEraTestNode(hre, async () => {
        await deployLibraries(
            hre,
            taskArgs.privateKeyOrIndex,
            taskArgs.externalConfigObjectPath,
            taskArgs.exportedConfigObject,
            taskArgs.noAutoPopulateConfig,
            taskArgs.compileAllContracts,
        );
    });
}

export async function deployZkSyncContract(taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<Contract> {
    return await deployContract(hre, taskArgs);
}
