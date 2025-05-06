export const SOLC_COMPILERS_LIST =
    'https://raw.githubusercontent.com/ethereum/solc-bin/refs/heads/gh-pages/bin/list.json';
export const SOLC_COMPILERS_LIST_ERROR = 'Unable to fetch solc versions from GitHub!';
export const SOLC_COMPILER_VERSION_NOTFOUND = (version: string) =>
    `Solidity compiler version ${version} is not found. See https://etherscan.io/solcversions for list of supported solc versions`;
