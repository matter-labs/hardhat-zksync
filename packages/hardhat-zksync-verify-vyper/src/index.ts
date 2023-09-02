import { extendEnvironment, task, subtask, types } from 'hardhat/internal/core/config/config-env';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import './type-extensions';

import {
    TASK_VERIFY_VYPER,
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
    TESTNET_VERIFY_URL,
    TASK_VERIFY_VERIFY_VYPER,
    TASK_CHECK_VERIFICATION_STATUS,
    TASK_VERIFY_GET_ARTIFACT,
} from './constants';

import { verify, getConstructorArguments, verifyContract, getArtifact } from './task-actions';
import { checkVerificationStatus } from './plugin';

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    hre.network.verifyURL = hre.network.config.verifyURL ?? TESTNET_VERIFY_URL;
});

task(TASK_VERIFY_VYPER, 'Verifies contract on Ethereum and zkSync networks')
    .addOptionalPositionalParam("address", "Address of the contract to verify")
    .addOptionalVariadicPositionalParam(
        "constructorArgsParams",
        "Contract constructor arguments. Cannot be used if the --constructor-args option is provided",
        []
    )
    .addOptionalParam(
        "constructorArgs",
        "Path to a Javascript module that exports the constructor arguments",
        undefined,
        types.inputFile
    )
    .addOptionalParam(
        "contract",
        "Fully qualified name of the contract to verify. Skips automatic detection of the contract. " +
        "Use if the deployed bytecode matches more than one contract in your project"
    ).setAction(verify);

task(TASK_CHECK_VERIFICATION_STATUS)
    .addParam('verificationId', 'An ID returned by the verification request', undefined, types.int)
    .setAction(checkVerificationStatus);

subtask(TASK_VERIFY_VERIFY_VYPER)
    .addOptionalParam("address")
    .addOptionalParam("constructorArguments", undefined, [], types.any)
    .addOptionalParam("contract")
    .setAction(verifyContract);

subtask(TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS).setAction(getConstructorArguments);

subtask(TASK_VERIFY_GET_ARTIFACT)
    .addOptionalParam("contract",
        "Fully qualified name of the contract to verify. Skips automatic detection of the contract. " +
        "Use if the deployed bytecode matches more than one contract in your project")
    .addParam("deployedBytecode", "Bytecode of the deployed contract")
    .setAction(getArtifact);
