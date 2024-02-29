# @matterlabs/hardhat-zksync-verify

## [0.5.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-verify-v0.5.0...@matterlabs/hardhat-zksync-verify-v0.5.1) (2024-02-29)


### Bug Fixes

* send to verify service compiler input settings ([#856](https://github.com/matter-labs/hardhat-zksync/issues/856)) ([f9fea75](https://github.com/matter-labs/hardhat-zksync/commit/f9fea7557b94b7567bcd857acefd90624a1f404d))

## [0.5.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-verify@0.4.0...@matterlabs/hardhat-zksync-verify-v0.5.0) (2024-01-26)


### Features

* support for zkvm solc compiler verification on ethers-v5 ([#698](https://github.com/matter-labs/hardhat-zksync/issues/698)) ([68fede6](https://github.com/matter-labs/hardhat-zksync/commit/68fede6a85e23197a651d37d70442be5e91cacab))


### Bug Fixes

* **docs:** update readme fils ([6fce5bd](https://github.com/matter-labs/hardhat-zksync/commit/6fce5bdd0ebc7d61519b5cc637f962c1390944ea))

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
