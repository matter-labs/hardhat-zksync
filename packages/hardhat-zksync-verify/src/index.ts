import '@nomicfoundation/hardhat-verify';

import { extendEnvironment, subtask, task, types } from 'hardhat/config';
import './type-extensions';
import './explorers/zksync-block-explorer/task-actions';
import './explorers/zksync-etherscan/task-actions';

import {
    TASK_VERIFY,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
    TASK_VERIFY_VERIFY,
    TASK_VERIFY_GET_CONTRACT_INFORMATION,
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
    TASK_VERIFY_GET_VERIFICATION_SUBTASKS,
    TASK_VERIFY_RESOLVE_ARGUMENTS,
} from './constants';

import {
    getCompilerVersions,
    verify,
    verifyContract,
    getContractInfo,
    getConstructorArguments,
    resolveArguments,
    getVerificationSubtasks,
} from './task-actions';

extendEnvironment((hre) => {
    if (hre.network.config.zksync) {
        hre.network.config.enableVerifyURL = hre.network.config.enableVerifyURL ?? false;
    }
});

subtask(TASK_VERIFY_GET_VERIFICATION_SUBTASKS).setAction(getVerificationSubtasks);

task(TASK_VERIFY, 'Verifies contract on Ethereum and ZKsync networks')
    .addFlag('noCompile', 'Run verify without compile')
    .setAction(verify);

subtask(TASK_VERIFY_VERIFY).setAction(verifyContract);

subtask(TASK_VERIFY_GET_COMPILER_VERSIONS).setAction(getCompilerVersions);

subtask(TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS).setAction(getConstructorArguments);

subtask(TASK_VERIFY_GET_CONTRACT_INFORMATION).setAction(getContractInfo);

subtask(TASK_VERIFY_RESOLVE_ARGUMENTS, 'Resolve verify arguments')
    .addOptionalPositionalParam('address', 'Address of the contract to verify')
    .addOptionalVariadicPositionalParam(
        'constructorArgsParams',
        'Contract constructor arguments. Cannot be used if the --constructor-args option is provided',
        [],
    )
    .addOptionalParam(
        'constructorArgs',
        'Path to a Javascript module that exports the constructor arguments',
        undefined,
        types.inputFile,
    )
    .addOptionalParam(
        'libraries',
        'Path to a Javascript module that exports a dictionary of library addresses. ' +
            'Use if there are undetectable library addresses in your contract. ' +
            'Library addresses are undetectable if they are only used in the contract constructor',
        undefined,
        types.inputFile,
    )
    .addOptionalParam(
        'contract',
        'Fully qualified name of the contract to verify. Skips automatic detection of the contract. ' +
            'Use if the deployed bytecode matches more than one contract in your project',
    )
    .addFlag(
        'force',
        'Enforce contract verification even if the contract is already verified. ' +
            'Use to re-verify partially verified contracts on Blockscout',
    )
    .addFlag('noCompile')
    .setAction(resolveArguments);
