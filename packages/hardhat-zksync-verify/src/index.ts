import '@nomicfoundation/hardhat-verify';

import { extendEnvironment, subtask, task, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import './type-extensions';

import {
    TASK_CHECK_VERIFICATION_STATUS,
    TASK_VERIFY,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
    TASK_VERIFY_GET_CONTRACT_INFORMATION,
    TASK_VERIFY_VERIFY,
    TESTNET_VERIFY_URL,
} from './constants';

import { checkVerificationStatus } from './plugin';
import { getCompilerVersions, getConstructorArguments, getContractInfo, verify, verifyContract } from './task-actions';

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    hre.network.verifyURL = hre.network.config.verifyURL ?? TESTNET_VERIFY_URL;
    hre.network.apikey = hre.network.config.apikey ?? '';
});

task(TASK_VERIFY, 'Verifies contract on Ethereum and zkSync networks')
    .addFlag('noCompile', 'Run verify without compile')
    .setAction(verify);

subtask(TASK_VERIFY_VERIFY).setAction(verifyContract);

subtask(TASK_VERIFY_GET_COMPILER_VERSIONS).setAction(getCompilerVersions);

subtask(TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS).setAction(getConstructorArguments);

subtask(TASK_VERIFY_GET_CONTRACT_INFORMATION).setAction(getContractInfo);

task(TASK_CHECK_VERIFICATION_STATUS)
    .addParam('verificationId', 'An ID returned by the verification request', undefined, types.int)
    .setAction(checkVerificationStatus);
