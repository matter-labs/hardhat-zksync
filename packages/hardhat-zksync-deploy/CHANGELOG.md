# @matterlabs/hardhat-zksync-deploy

## [1.2.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-deploy-v1.1.2...@matterlabs/hardhat-zksync-deploy-v1.2.0) (2024-02-23)


### Features

* support for script tags, order, integrated deployer inside HRE ([#762](https://github.com/matter-labs/hardhat-zksync/issues/762)) ([a6b7828](https://github.com/matter-labs/hardhat-zksync/commit/a6b7828cd390087f426c97439eb1a2aeb686cf95))

## [1.1.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-deploy@1.1.1...@matterlabs/hardhat-zksync-deploy-v1.1.2) (2023-12-22)


### Fixes

* **docs:** update readme files ([#612](https://github.com/matter-labs/hardhat-zksync/issues/612)) ([682338e](https://github.com/matter-labs/hardhat-zksync/commit/682338e60f52021206325ff6eeec2c394a118642))

## 1.1.1

### Patch Changes

- 70811d0: Fixed edge case when ethNetwork is provided as URL

## 1.1.0

### Minor Changes

- f216797: Migration from zksync2-js to zksync-ethers

## 1.0.3

### Patch Changes

- 238cbb7: Proper User-Agent for getRelease function

## 1.0.1

### Patch Changes

- ee858a6: Added support for Sepolia testnet.

## 1.0.0

### Major Changes

- 7a38bb8: Migrated from zksync-web3 to zksync2-js and updated dependencies on hardhat and ethers.

## 0.6.5

### Patch Changes

- Updated dependencies [a079196]
  - @matterlabs/hardhat-zksync-solc@0.4.2

## 0.6.4

### Patch Changes

- 6507daa:
  - Use configured wallet provider in the deployer class
  - Prevent duplicated bytecodes in factory deps
