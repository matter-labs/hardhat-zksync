# @matterlabs/hardhat-zksync-verify

## [1.4.3](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-verify-v1.4.2...@matterlabs/hardhat-zksync-verify-v1.4.3) (2024-05-14)


### Bug Fixes

* get valid minimal context for verification BE request ([#1061](https://github.com/matter-labs/hardhat-zksync/issues/1061)) ([6d197e8](https://github.com/matter-labs/hardhat-zksync/commit/6d197e81df8cba117969e716c75f9cc72c54b0b0))

## [1.4.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-verify-v1.4.1...@matterlabs/hardhat-zksync-verify-v1.4.2) (2024-04-03)


### Bug Fixes

* add missing setting properties to support isSystem and forceEvml… ([#965](https://github.com/matter-labs/hardhat-zksync/issues/965)) ([b32243a](https://github.com/matter-labs/hardhat-zksync/commit/b32243a8bf4bf8fe71b81359a99cf9bd06117e4a))
* call fallback verification with full source codes when BE throws… ([#968](https://github.com/matter-labs/hardhat-zksync/issues/968)) ([bfe86f2](https://github.com/matter-labs/hardhat-zksync/commit/bfe86f24a22b6dcd0a2286d33fc450adb0bcc2bc))
* remove zksync-ethers dependency ([#876](https://github.com/matter-labs/hardhat-zksync/issues/876)) ([5964e3f](https://github.com/matter-labs/hardhat-zksync/commit/5964e3f35550bb14ddb50ca019e60d4b24d636d5))
* update deploy cache logic with script load path support for windows ([#865](https://github.com/matter-labs/hardhat-zksync/issues/865)) ([c30e276](https://github.com/matter-labs/hardhat-zksync/commit/c30e276903e97b12283bb742659e513bdb9dafe6))

## [1.4.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-verify-v1.4.0...@matterlabs/hardhat-zksync-verify-v1.4.1) (2024-02-29)


### Bug Fixes

* send to verify service compiler input settings ([#854](https://github.com/matter-labs/hardhat-zksync/issues/854)) ([1452e2e](https://github.com/matter-labs/hardhat-zksync/commit/1452e2e8db22d399a9142c07ea38ca7ce5fea697))

## [1.4.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-verify-v1.3.0...@matterlabs/hardhat-zksync-verify-v1.4.0) (2024-02-26)


### Features

* bump hardhat-zksync-deploy and hardhat-zksync-solc dependencies… ([#840](https://github.com/matter-labs/hardhat-zksync/issues/840)) ([b570877](https://github.com/matter-labs/hardhat-zksync/commit/b570877c78c74f3c88c7e62498e5f477d4ada616))

## [1.3.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-verify-v1.2.2...@matterlabs/hardhat-zksync-verify-v1.3.0) (2024-01-22)


### Features

* support for zkvm solc compiler verification ([#662](https://github.com/matter-labs/hardhat-zksync/issues/662)) ([a1fef16](https://github.com/matter-labs/hardhat-zksync/commit/a1fef1662ae5d9687d48bfa0e076cf3313e222df))

## [1.2.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-verify@1.2.1...@matterlabs/hardhat-zksync-verify-v1.2.2) (2023-12-22)


### Fixes

* **docs:** update readme files ([#612](https://github.com/matter-labs/hardhat-zksync/issues/612)) ([682338e](https://github.com/matter-labs/hardhat-zksync/commit/682338e60f52021206325ff6eeec2c394a118642))

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
