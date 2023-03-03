export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-verify';

export const TESTNET_VERIFY_URL = 'https://zksync2-testnet-explorer.zksync.dev/contract_verification';

export const TASK_COMPILE = 'compile';
export const TASK_VERIFY = 'verify';
export const TASK_VERIFY_VERIFY = 'verify:verify';
export const TASK_VERIFY_CONTRACT = 'zk:verify:contract';
export const TASK_CHECK_VERIFICATION_STATUS = 'verify-status';

export const TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS = 'verify:get-constructor-arguments';
export const TASK_VERIFY_GET_LIBRARIES = 'verify:get-libraries';
export const TASK_VERIFY_GET_COMPILER_VERSIONS = 'verify:get-compiler-versions';
export const TASK_VERIFY_GET_MINIMUM_BUILD = 'verify:get-minimum-build';
export const TASK_VERIFY_VERIFY_MINIMUM_BUILD = 'zk:verify:verify-minimum-build';
export const TASK_VERIFY_GET_CONTRACT_INFORMATION = 'verify:get-contract-information';

export const CONST_ARGS_ARRAY_ERROR = `The constructorArgs parameter should be an array.
If your constructor has no arguments pass an empty array. E.g:

  await run("${TASK_VERIFY_VERIFY}", {
    <other args>,
    constructorArguments: []
  };`;

export const NO_VERIFIABLE_ADDRESS_ERROR =
    "You did not provide any address. Please re-run the 'verify' task with the address of the contract you want to verify.";

export const NO_MATCHING_CONTRACT = `The address provided as argument contains a contract, but its bytecode doesn't match any of your local contracts.

      Possible causes are:
        - Contract code changed after the deployment was executed. This includes code for seemingly unrelated contracts.
        - A solidity file was added, moved, deleted or renamed after the deployment was executed. This includes files for seemingly unrelated contracts.
        - Solidity compiler settings were modified after the deployment was executed (like the optimizer, target EVM, etc.).
        - The given address is wrong.
        - The selected network is wrong.`;

export const MULTIPLE_MATCHING_CONTRACTS = `More than one contract was found to match the deployed bytecode.
      Please use the contract parameter with one of the contracts:

      For example:

        hardhat verify --contract contracts/Example.sol:ExampleContract <other args>

      If you are running the verify subtask from within Hardhat instead:

        await run("${TASK_VERIFY_VERIFY}", {
          <other args>,
          contract: "contracts/Example.sol:ExampleContract"
        };`;

export const CONTRACT_NAME_NOT_FOUND = `You did not provide any contract name. Please add fully qualified name of your contract. 
Qualified names look like this: contracts/AContract.sol:TheContract`;

export const COMPILER_VERSION_NOT_SUPPORTED =
    'Solidity compiler you used to compile the contract is not currently supported by zkSync block explorer!\nPlease use one of the supporting versions';

export const WRONG_CONSTRUCTOR_ARGUMENTS = 'types/values length mismatch';

export const PENDING_CONTRACT_INFORMATION_MESSAGE = (verificationId: number) => `
Your verification request has been sent, but our servers are currently overloaded and we could not confirm that the verification was successful.
Please try one of the following options:
  1. Use the your verification request ID (${verificationId}) to check the status of the pending verification process by typing the command 'yarn hardhat verify-status --verification-id ${verificationId}'
  2. Manually check the contract's code on the zksync block explorer: https://explorer.zksync.io/
  3. Run the verification process again
  `;

export const SINGLE_FILE_CODE_FORMAT = 'solidity-single-file';
export const JSON_INPUT_CODE_FORMAT = 'solidity-standard-json-input';
