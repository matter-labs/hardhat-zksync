export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-verify';

export const TESTNET_VERIFY_URL = 'https://explorer.sepolia.era.zksync.dev/contract_verification';

export const TASK_COMPILE = 'compile';
export const TASK_VERIFY = 'verify';
export const TASK_VERIFY_VERIFY = 'verify:verify';
export const TASK_VERIFY_CONTRACT = 'zk:verify:contract';
export const TASK_CHECK_VERIFICATION_STATUS = 'verify-status';
export const TASK_VERIFY_ETHERSCAN = 'verify:etherscan';

export const TASK_VERIFY_ZKSYNC_EXPLORER = 'verify:zksync-blockexplorer';
export const TASK_VERIFY_ZKSYNC_ETHERSCAN = 'verify:zksync-etherscan';

export const TASK_VERIFY_RESOLVE_ARGUMENTS = 'verify:resolve-arguments';
export const TASK_VERIFY_GET_VERIFICATION_SUBTASKS = 'verify:get-verification-subtasks';

export const TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS = 'verify:get-constructor-arguments';
export const TASK_VERIFY_GET_LIBRARIES = 'verify:get-libraries';
export const TASK_VERIFY_GET_COMPILER_VERSIONS = 'verify:get-compiler-versions';
export const TASK_VERIFY_GET_MINIMUM_BUILD = 'verify:get-minimum-build';
export const TASK_VERIFY_VERIFY_MINIMUM_BUILD = 'zk:verify:verify-minimum-build';
export const TASK_VERIFY_GET_CONTRACT_INFORMATION = 'verify:get-contract-information';

export const USING_COMPILER_PATH_ERROR =
    'Using a compilerPath in the setting without compile is not supported. Please run verify without --no-compile flag or specify a official compiler version.';

export const CONST_ARGS_ARRAY_ERROR = `
Wrong constructor arguments format:

If your constructor arguments are not encoded, they should be passed as an array parameter. E.g:
  await run("${TASK_VERIFY_VERIFY}", {
    <other args>,
    constructorArguments: [arg1, arg2, ...]
  };

If your constructor has no arguments pass an empty array. E.g:
  await run("${TASK_VERIFY_VERIFY}", {
    <other args>,
    constructorArguments: []
  };
  
If your constructor arguments are already encoded, they should be passed as a non-array constructorArgs parameter. E.g:
  await run("${TASK_VERIFY_VERIFY}", {
    <other args>,
    constructorArguments: encodedConstructorArguments
  };

  Please refer to the documentation page for more info: https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-verify
`;

export const BUILD_INFO_NOT_FOUND_ERROR = (
    contractFQN: string,
) => `We couldn't find the sources of your "${contractFQN}" contract in the project.
Please make sure that it has been compiled by Hardhat and that it is written in Solidity.`;

export const LIBRARIES_EXPORT_ERROR = (librariesModulePath: string) =>
    `The module ${librariesModulePath} doesn't export a dictionary. The module should look like this: module.exports = { lib1: "0x...", lib2: "0x...", ... };`;

export const ENCODED_ARAGUMENTS_NOT_FOUND_ERROR = (constructorArgsModulePath: string) =>
    `The module ${constructorArgsModulePath} doesn't export a list and does not start with "0x"\n` +
    `Please export a list of constructor arguments or a single string starting with "0x".`;

export const CONSTRUCTOR_MODULE_IMPORTING_ERROR = (
    errorMessage: string,
) => `Importing the module for the constructor arguments list failed.
Reason: ${errorMessage}`;

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
    'Solidity compiler you used to compile the contract is not currently supported by ZKsync block explorer!\nPlease use one of the supporting versions';

export const WRONG_CONSTRUCTOR_ARGUMENTS = 'types/values length mismatch';

export const PENDING_CONTRACT_INFORMATION_MESSAGE = (browserUrl?: string) => `
Your verification request has been sent, but our servers are currently overloaded and we could not confirm that the verification was successful.
Please try one of the following options:
  1. Manually check the contract's code on the explorer ${browserUrl ? `: ${browserUrl}` : '.'}
  2. Run the verification process again`;

export const SINGLE_FILE_CODE_FORMAT = 'solidity-single-file';
export const JSON_INPUT_CODE_FORMAT = 'solidity-standard-json-input';

export const UNSUCCESSFUL_CONTEXT_COMPILATION_MESSAGE = `Compiling your contract excluding unrelated contracts did not produce identical bytecode.
Trying again with the full solc input used to compile and deploy it.
This means that unrelated contracts may be displayed on the zksync block explorer.
`;

export const COMPILERS_CONFLICT_ZKVM_SOLC = (version: string) =>
    `Solidity compiler versions in your Hardhat config file are in conflict for version ${version}. Please specify version of compiler only with zkVm support(eraVersion) or without it`;

export const COMPILATION_ERRORS = [
    {
        error: 'CompilationError',
        pattern: /^Backend verification error: Compilation error.*$/s,
    },
    {
        error: 'MissingSource',
        pattern: /^Backend verification error: There is no .* source file$/,
    },
    {
        error: 'MissingContract',
        pattern: /^Backend verification error: Contract with .* name is missing in sources$/,
    },
    {
        error: 'DeployedBytecodeMismatch',
        pattern: /^Backend verification error: Deployed bytecode is not equal to generated one from given source$/,
    },
];
