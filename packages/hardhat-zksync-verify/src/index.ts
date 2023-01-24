import '@nomiclabs/hardhat-etherscan';

import { extendEnvironment, subtask, task, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import './type-extensions';

import {
    TASK_VERIFY,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
    TASK_VERIFY_VERIFY,
    TESTNET_VERIFY_URL,
    TASK_VERIFY_GET_CONTRACT_INFORMATION,
    TASK_VERIFY_VERIFY_MINIMUM_BUILD,
    TASK_CHECK_VERIFICATION_STATUS,
} from './constants';

import {
    getCompilerVersions,
    verify,
    verifyContract,
    getContractInfo,
    verifyMinimumBuild,
    checkVerificationStatus,
} from './task-actions';

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    hre.network.verifyURL = hre.network.config.verifyURL ?? TESTNET_VERIFY_URL;
});

task(TASK_VERIFY, 'Verifies contract on Ethereum and zkSync networks').setAction(verify);

subtask(TASK_VERIFY_VERIFY).setAction(verifyContract);

subtask(TASK_VERIFY_GET_COMPILER_VERSIONS).setAction(getCompilerVersions);

subtask(TASK_VERIFY_VERIFY_MINIMUM_BUILD).setAction(verifyMinimumBuild);

subtask(TASK_VERIFY_GET_CONTRACT_INFORMATION).setAction(getContractInfo);

task(TASK_CHECK_VERIFICATION_STATUS)
    .addParam('verificationId', 'An ID returned by the verification request', undefined, types.int)
    .setAction(checkVerificationStatus);
