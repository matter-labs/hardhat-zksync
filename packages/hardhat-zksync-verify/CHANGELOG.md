# @matterlabs/hardhat-zksync-verify

## 1.2.1

### Patch Changes

- 065f52a: Fixed to work with non zksync networks

## 1.2.0

### Minor Changes

- f216797: Migration from zksync2-js to zksync-ethers

## 1.1.1

### Patch Changes

- 523985a: Added support for Sepolia testnet.

## 1.1.0

### Minor Changes

- 1148d9f: Bumped hardhat-verify version and used latest version zksync solc compiler

## 1.0.0

### Major Changes

- b3b175b: Hardhat version updates

## 0.2.1

### Patch Changes

- 64f5de0: Add noCompile flag to the contract verification script to not recompile the contracts before sending verification request

## 0.2.0

### Minor Changes

- 30d802a: Replaced hardhat-etherscan dependency with hardhat-verify dependency

## 0.1.8

### Patch Changes

- a730d07: Enable passing encoded constructor arguments in 'verify' task and 'verify:verify' subtask
- cd50e0e: Add quiet compiling during the verification process

## 0.1.7

### Patch Changes

- 670534e: Fallback verification support
- d8b7c80: Axios dependency update
- 1146fee: Expand matching solidity compilers with overrides

## 0.1.6

### Patch Changes

- c185b99: 'verify:verify' task now returns verification id
- 892c1de: Updated the usage of cbor's DecoderOptions type
- Updated dependencies [c9c91f7]
  - @matterlabs/hardhat-zksync-solc@0.3.17

## 0.1.5

### Patch Changes

- ebdc1e2: Read zksolc optimization settings and add them in verify request
