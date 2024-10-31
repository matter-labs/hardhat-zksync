import { subtask, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import chalk from 'chalk';
import { TASK_VERIFY_ZKSYNC_EXPLORER } from '../../constants';
import { ZkSyncVerifyPluginError } from '../../errors';
import { TRYING_VERIFICATION_WITH_FULL_COMPILER_INPUT } from '../constants';
import { getProvidedChainConfig, ZkSyncExplorerService } from './service';
import { builtinChains } from './chain-config';

subtask(TASK_VERIFY_ZKSYNC_EXPLORER)
    .addParam('address')
    .addOptionalParam('constructorArguments', undefined, undefined, types.any)
    .addOptionalParam('libraries', undefined, undefined, types.any)
    .addOptionalParam('contract')
    .addFlag('force')
    .addFlag('noCompile')
    .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const providedChain = await getProvidedChainConfig(hre);
        const chainConfig = await ZkSyncExplorerService.getCurrentChainConfig(
            hre.network.provider,
            providedChain ? [providedChain] : [],
            builtinChains,
        );

        const explorer = await ZkSyncExplorerService.fromChainConfig(hre, chainConfig);

        const { verificationId, contractVerifyDataInfo } = await explorer.verify(
            taskArgs.address,
            taskArgs.contract,
            taskArgs.constructorArguments,
            taskArgs.libraries,
            taskArgs.noCompile,
        );
        const result = await explorer.getVerificationStatusWithRetry(verificationId, contractVerifyDataInfo);

        if (result.isSuccess()) {
            return;
        }

        console.warn(chalk.red(TRYING_VERIFICATION_WITH_FULL_COMPILER_INPUT(contractVerifyDataInfo.contractName)));

        const { verificationId: verificationIdFallback } = await explorer.verify(
            taskArgs.address,
            taskArgs.contract,
            taskArgs.constructorArguments,
            taskArgs.libraries,
            taskArgs.noCompile,
            true,
        );
        const fallbackResult = await explorer.getVerificationStatusWithRetry(
            verificationIdFallback,
            contractVerifyDataInfo,
        );

        if (fallbackResult.isSuccess()) {
            return;
        }

        throw new ZkSyncVerifyPluginError(fallbackResult.getError());
    });
