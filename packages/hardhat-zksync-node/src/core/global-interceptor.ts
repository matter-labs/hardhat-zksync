import { RunSuperFunction, TaskArguments } from 'hardhat/types';
import { GlobalWithHardhatContext } from 'hardhat/src/internal/context';
import { HARDHAT_NETWORK_NAME } from 'hardhat/plugins';
import { configureNetwork, startServer, waitForNodeToBeReady } from '../utils';
import { ZKSyncTasksWithWrappedNode } from './global-task';

export function interceptAndWrapTasksWithNode() {
    const zkSyncGlobal = global as ZKSyncTasksWithWrappedNode & GlobalWithHardhatContext;
    const taskMap = zkSyncGlobal.__hardhatContext.tasksDSL.getTaskDefinitions();

    if (!zkSyncGlobal._zkSyncTasksForWrapping) {
        return;
    }

    zkSyncGlobal._zkSyncTasksForWrapping.taskNames.forEach((taskName) => {
        const foundTask = taskMap[taskName];

        if (!foundTask) {
            return;
        }

        if (foundTask.isSubtask) {
            zkSyncGlobal.__hardhatContext.tasksDSL.subtask(foundTask.name, foundTask.description, wrapTaskWithNode);
        }

        zkSyncGlobal.__hardhatContext.tasksDSL.task(foundTask.name, foundTask.description, wrapTaskWithNode);
    });
}

async function wrapTaskWithNode(taskArgs: TaskArguments, env: any, runSuper: RunSuperFunction<TaskArguments>) {
    if (env.network.zksync !== true || env.network.name !== HARDHAT_NETWORK_NAME) {
        return await runSuper(taskArgs);
    }
    const zkSyncGlobal = global as ZKSyncTasksWithWrappedNode;
    const { commandArgs, server, port } = await startServer(
        env.config.zksyncAnvil.version,
        env.config.zksyncAnvil.binaryPath,
        false,
        { quiet: true },
    );
    try {
        await server.listen(commandArgs, false);
        await waitForNodeToBeReady(port);
        const oldNetwork = env.network;
        await configureNetwork(env.config, env.network, port);
        env.injectToGlobal();
        zkSyncGlobal._zkSyncNodeNetwork = env.network;
        const result = await runSuper(taskArgs);
        env.network = oldNetwork;
        delete zkSyncGlobal._zkSyncNodeNetwork;
        env.injectToGlobal();
        return result;
    } finally {
        await server.stop();
    }
}
