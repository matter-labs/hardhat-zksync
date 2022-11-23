import { extendEnvironment, subtask, task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import {
    TASK_VERIFY,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
    TASK_VERIFY_VERIFY,
    TASK_VERIFY_CONTRACT,
    TESTNET_VERIFY_URL,
} from './constants';

import { getCompilerVersions, verify, sendVerificationRequest, verifyContract } from './task-actions';

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    hre.network.verifyURL = hre.network.config.verifyURL ?? TESTNET_VERIFY_URL;
});

task(TASK_VERIFY, 'Verifies contract on Ethereum and zkSync networks').setAction(verify);

subtask(TASK_VERIFY_VERIFY).setAction(verifyContract);

subtask(TASK_VERIFY_CONTRACT, 'Contract verification').setAction(sendVerificationRequest);

subtask(TASK_VERIFY_GET_COMPILER_VERSIONS).setAction(getCompilerVersions);
