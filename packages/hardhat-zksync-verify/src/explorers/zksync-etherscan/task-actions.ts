import { subtask, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types';
import chalk from 'chalk';
import { TASK_VERIFY_ETHERSCAN, TASK_VERIFY_RESOLVE_ARGUMENTS, TASK_VERIFY_ZKSYNC_ETHERSCAN } from '../../constants';
import { ZkSyncVerifyPluginError } from '../../errors';
import { TRYING_VERIFICATION_WITH_FULL_COMPILER_INPUT } from '../constants';
import { ZkSyncEtherscanExplorerService } from './service';
import { builtinChains } from './chain-config';

subtask(TASK_VERIFY_ETHERSCAN)
    .addFlag('noCompile')
    .setAction(async (taskArgs: TaskArguments, { run, network }: HardhatRuntimeEnvironment, runSuper) => {
        if (!network.config.zksync) {
            return await runSuper(taskArgs);
        }
        const { address, constructorArguments, libraries, contractFQN, force } = await run(
            TASK_VERIFY_RESOLVE_ARGUMENTS,
            taskArgs,
        );

        return await run(TASK_VERIFY_ZKSYNC_ETHERSCAN, {
            address,
            constructorArguments,
            libraries,
            contractFQN,
            force,
            noCompile: taskArgs.noCompile,
        });
    });

subtask(TASK_VERIFY_ZKSYNC_ETHERSCAN)
    .addParam('address')
    .addOptionalParam('constructorArguments', undefined, undefined, types.any)
    .addOptionalParam('libraries', undefined, undefined, types.any)
    .addOptionalParam('contract')
    .addFlag('force')
    .addFlag('noCompile')
    .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const chainConfig = await ZkSyncEtherscanExplorerService.getCurrentChainConfig(
            hre.network.provider,
            hre.config.etherscan.customChains,
            builtinChains,
        );

        const etherscan = await ZkSyncEtherscanExplorerService.fromChainConfig(
            hre,
            hre.config.etherscan.apiKey,
            chainConfig,
        );

        const { verificationId, contractVerifyDataInfo } = await etherscan.verify(
            taskArgs.address,
            taskArgs.contract,
            taskArgs.constructorArguments,
            taskArgs.libraries,
            taskArgs.noCompile,
        );
        const result = await etherscan.getVerificationStatusWithRetry(verificationId, contractVerifyDataInfo);

        if (result.isSuccess()) {
            return;
        }

        console.warn(chalk.red(TRYING_VERIFICATION_WITH_FULL_COMPILER_INPUT(contractVerifyDataInfo.contractName)));

        const { verificationId: verificationIdFallback } = await etherscan.verify(
            taskArgs.address,
            taskArgs.contract,
            taskArgs.constructorArguments,
            taskArgs.libraries,
            taskArgs.noCompile,
            true,
        );
        const fallbackResult = await etherscan.getVerificationStatusWithRetry(
            verificationIdFallback,
            contractVerifyDataInfo,
        );

        if (fallbackResult.isSuccess()) {
            return;
        }

        throw new ZkSyncVerifyPluginError(fallbackResult.message);
    });
