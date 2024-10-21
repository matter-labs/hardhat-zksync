export const TRYING_VERIFICATION_WITH_FULL_COMPILER_INPUT = (
    contractName: string,
) => `We tried verifying your contract ${contractName} without including any unrelated one, but it failed.
Trying again with the full solc input used to compile and deploy it.
This means that unrelated contracts may be displayed on the explorer.`;

export const PROVIDED_CHAIN_IS_NOT_SUPPORTED_FOR_VERIFICATION = (chainId: number) =>
    `The provided chain with id ${chainId} is not supported by default!`;
