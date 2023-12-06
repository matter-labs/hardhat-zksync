export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-verify-vyper';

export const TESTNET_VERIFY_URL = 'https://explorer.sepolia.era.zksync.dev/contract_verification';

export const TASK_COMPILE_VYPER = "compile:vyper";

export const TASK_VERIFY_VYPER = 'verify:vyper';
export const TASK_CHECK_VERIFICATION_STATUS = 'verify-status:vyper';
export const TASK_VERIFY_VERIFY_VYPER = 'verify:verify:vyper';
export const TASK_VERIFY_GET_ARTIFACT = 'verify:vyper:get-artifact';

export const TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS = 'verify:vyper:get-constructor-arguments';

export const JSON_INPUT_CODE_FORMAT = 'vyper-multi-file';

export const CONST_ARGS_ARRAY_ERROR = `
Wrong constructor arguments format:

If your constructor arguments are not encoded, they should be passed as an array parameter. E.g:
  await run("${TASK_VERIFY_VERIFY_VYPER}", {
    <other args>,
    constructorArguments: [arg1, arg2, ...]
  };

If your constructor has no arguments pass an empty array. E.g:
  await run("${TASK_VERIFY_VERIFY_VYPER}", {
    <other args>,
    constructorArguments: []
  };
  
If your constructor arguments are already encoded, they should be passed as a non-array constructorArgs parameter. E.g:
  await run("${TASK_VERIFY_VERIFY_VYPER}", {
    <other args>,
    constructorArguments: encodedConstructorArguments
  };

  Please refer to the documentation page for more info: https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-verify.html
`;

export const ENCODED_ARAGUMENTS_NOT_FOUND_ERROR = (constructorArgsModulePath: string) =>
  `The module ${constructorArgsModulePath} doesn't export a list and does not start with "0x"\n` +
  `Please export a list of constructor arguments or a single string starting with "0x".`;

export const CONSTRUCTOR_MODULE_IMPORTING_ERROR = (
  errorMessage: string
) => `Importing the module for the constructor arguments list failed.
Reason: ${errorMessage}`;

export const BYTECODES_ARE_NOT_SAME =
  "Deployed and stored bytecodes are not the same.";


export const NO_VERIFIABLE_ADDRESS_ERROR =
  "You did not provide any address. Please re-run the 'verify:vyper' task with the address of the contract you want to verify.";

export const NO_MATCHING_CONTRACT = `The address provided as argument contains a contract, but its bytecode doesn't match any of your local contracts.

      Possible causes are:
        - Contract code changed after the deployment was executed. This includes code for seemingly unrelated contracts.
        - A vyper file was added, moved, deleted or renamed after the deployment was executed. This includes files for seemingly unrelated contracts.
        - Vyper compiler settings were modified after the deployment was executed (like the optimizer, target EVM, etc.).
        - The given address is wrong.
        - The selected network is wrong.`;

export const MULTIPLE_MATCHING_CONTRACTS = `More than one contract was found to match the deployed bytecode.
      Please use the contract parameter with one of the contracts:

      For example:

        hardhat verify:vyper --contract contracts/Example.vy:Example <other args>

      If you are running the verify subtask from within Hardhat instead:

        await run("${TASK_VERIFY_VERIFY_VYPER}", {
          <other args>,
          contract: "contracts/Example.vy:Example"
        };`;

export const CONTRACT_NAME_NOT_FOUND = `You did not provide any contract name. Please add fully qualified name of your contract. 
Qualified names look like this: contracts/Example.vy:Example`;

export const COMPILER_VERSION_NOT_SUPPORTED =
  'Vyper compiler you used to compile the contract is not currently supported by zkSync block explorer!\nPlease use one of the supporting versions';

export const ZK_COMPILER_VERSION_NOT_SUPPORTED =
  'ZkVyper compiler you used to compile the contract is not currently supported.\n Please use one of the supporting versions';

export const WRONG_CONSTRUCTOR_ARGUMENTS = 'types/values length mismatch';

export const PENDING_CONTRACT_INFORMATION_MESSAGE = (verificationId: number) => `
Your verification request has been sent, but our servers are currently overloaded and we could not confirm that the verification was successful.
Please try one of the following options:
  1. Use the your verification request ID (${verificationId}) to check the status of the pending verification process by typing the command 'yarn hardhat verify-status --verification-id ${verificationId}'
  2. Manually check the contract's code on the zksync block explorer: https://explorer.zksync.io/
  3. Run the verification process again
  `;

export const UNSUCCESSFUL_CONTEXT_COMPILATION_MESSAGE = `Compiling your contract excluding unrelated contracts did not produce identical bytecode.
Trying again with the full solc input used to compile and deploy it.
This means that unrelated contracts may be displayed on the zksync block explorer.
`;
