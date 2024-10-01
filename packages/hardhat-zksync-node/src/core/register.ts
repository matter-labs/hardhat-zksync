import debug from 'debug';

import { HardhatContext } from 'hardhat/internal/context';
import { loadConfigAndTasks } from 'hardhat/internal/core/config/config-loading';
import { getEnvHardhatArguments } from 'hardhat/internal/core/params/env-variables';
import { HARDHAT_PARAM_DEFINITIONS } from 'hardhat/internal/core/params/hardhat-params';
import { Environment } from 'hardhat/internal/core/runtime-environment';
import { loadTsNode, willRunWithTypescript } from 'hardhat/internal/core/typescript-support';
import { disableReplWriterShowProxy, isNodeCalledWithoutAScript } from 'hardhat/internal/util/console';
import { LazyInitializationProviderAdapter } from 'hardhat/internal/core/providers/lazy-initialization';
import { log } from 'console';
import { createProvider } from 'hardhat/internal/core/providers/construction';
import { MessageTrace } from 'hardhat/internal/hardhat-network/stack-traces/message-trace';
import { Artifacts } from 'hardhat/internal/artifacts';
import { BASE_URL, ZKSYNC_ERA_TEST_NODE_NETWORK_NAME } from '../constants';
import { getNetworkConfig } from '../utils';

if (!HardhatContext.isCreated()) {
    require('source-map-support/register');

    const ctx = HardhatContext.createHardhatContext();

    if (isNodeCalledWithoutAScript()) {
        disableReplWriterShowProxy();
    }

    const hardhatArguments = getEnvHardhatArguments(HARDHAT_PARAM_DEFINITIONS, process.env);

    if (hardhatArguments.verbose) {
        debug.enable('hardhat*');
    }

    if (willRunWithTypescript(hardhatArguments.config)) {
        loadTsNode(hardhatArguments.tsconfig, hardhatArguments.typecheck);
    }

    const { resolvedConfig, userConfig } = loadConfigAndTasks(hardhatArguments);

    const env = new Environment(
        resolvedConfig,
        hardhatArguments,
        ctx.tasksDSL.getTaskDefinitions(),
        ctx.tasksDSL.getScopesDefinitions(),
        ctx.environmentExtenders,
        ctx.experimentalHardhatNetworkMessageTraceHooks,
        userConfig,
        ctx.providerExtenders,
    );

    const zksyncNodePort = process.env.ZKNodePort;
    const url = `${BASE_URL}:${zksyncNodePort}`;
    const networkName = ZKSYNC_ERA_TEST_NODE_NETWORK_NAME;

    env.network.name = networkName;
    Object.assign(env.network.config, getNetworkConfig(url));
    resolvedConfig.networks[env.network.name] = env.network.config;

    const artifacts = new Artifacts(resolvedConfig.paths.artifacts);

    const provider = new LazyInitializationProviderAdapter(async () => {
        log(`Creating provider for network ${networkName}`);
        return createProvider(
            resolvedConfig,
            networkName,
            artifacts,
            ctx.experimentalHardhatNetworkMessageTraceHooks.map(
                (hook) => (trace: MessageTrace, isCallMessageTrace: boolean) => hook(env, trace, isCallMessageTrace),
            ),
            ctx.providerExtenders,
        );
    });

    env.network.provider = provider;
    ctx.setHardhatRuntimeEnvironment(env);

    env.injectToGlobal();
}
