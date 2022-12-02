export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-verify';

export const TESTNET_VERIFY_URL = 'https://zksync2-testnet-explorer.zksync.dev/contract_verification';

export const TASK_COMPILE = 'compile';
export const TASK_VERIFY = 'verify';
export const TASK_VERIFY_VERIFY = 'verify:verify';
export const TASK_VERIFY_CONTRACT = 'zk:verify:contract';

export const TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS = 'verify:get-constructor-arguments';
export const TASK_VERIFY_GET_LIBRARIES = 'verify:get-libraries';
export const TASK_VERIFY_GET_COMPILER_VERSIONS = 'verify:get-compiler-versions';
export const TASK_VERIFY_GET_MINIMUM_BUILD = 'verify:get-minimum-build';

export const CONST_ARGS_ARRAY_ERROR = `The constructorArgs parameter should be an array.
If your constructor has no arguments pass an empty array. E.g:

  await run("${TASK_VERIFY_VERIFY}", {
    <other args>,
    constructorArguments: []
  };`;

export const NO_VERIFIABLE_ADDRESS_ERROR =
    "You did not provide any address. Please re-run the 'verify' task with the address of the contract you want to verify.";
