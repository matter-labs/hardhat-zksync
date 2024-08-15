# @matterlabs/hardhat-zksync-solc

## [1.2.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-solc-v1.2.1...@matterlabs/hardhat-zksync-solc-v1.2.2) (2024-08-15)


### Bug Fixes

* introduce forceContrectsToCompile to ensure that contracts not present in the source path are compiled ([#1290](https://github.com/matter-labs/hardhat-zksync/issues/1290)) ([fcbcd1f](https://github.com/matter-labs/hardhat-zksync/commit/fcbcd1f56fd66be02af8fd60358656327521093e))

## [1.2.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-solc-v1.2.0...@matterlabs/hardhat-zksync-solc-v1.2.1) (2024-07-09)


### Bug Fixes

* compiler path issue with compiler breakable changes ([#1212](https://github.com/matter-labs/hardhat-zksync/issues/1212)) ([c4231d9](https://github.com/matter-labs/hardhat-zksync/commit/c4231d922421887af60e6ebcec755ce6856292e6))

## [1.2.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-solc-v1.1.4...@matterlabs/hardhat-zksync-solc-v1.2.0) (2024-06-19)


### Features

* bump ethers, zksync-ethers, hardaht and other dependencies to newer versions ([#1111](https://github.com/matter-labs/hardhat-zksync/issues/1111)) ([a2d503a](https://github.com/matter-labs/hardhat-zksync/commit/a2d503abe3f504859651f22998046576eddf6579))
* switch to the default codegen with zksolc ([#1062](https://github.com/matter-labs/hardhat-zksync/issues/1062)) ([5ec997a](https://github.com/matter-labs/hardhat-zksync/commit/5ec997aaa83ba18d978f10b96f489513f6c4dd9f))

## [1.1.4](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-solc-v1.1.3...@matterlabs/hardhat-zksync-solc-v1.1.4) (2024-02-26)


### Bug Fixes

* add mock extension for compiler path remote origins ([#824](https://github.com/matter-labs/hardhat-zksync/issues/824)) ([14e3e80](https://github.com/matter-labs/hardhat-zksync/commit/14e3e80df60cc74ae2c26f6bfa487b17bd212f73))
* adjust solc message for missing libraries ([#783](https://github.com/matter-labs/hardhat-zksync/issues/783)) ([aa2b48b](https://github.com/matter-labs/hardhat-zksync/commit/aa2b48b98d5fc11570161a6b7cdfa1944ef5e8a4))

## [1.1.3](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-solc-v1.1.2...@matterlabs/hardhat-zksync-solc-v1.1.3) (2024-02-21)


### Bug Fixes

* set zksolc compiler version for specified compiler path ([#804](https://github.com/matter-labs/hardhat-zksync/issues/804)) ([7d2aa6c](https://github.com/matter-labs/hardhat-zksync/commit/7d2aa6cd180d601161af0399bd8fad884f598683))

## [1.1.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-solc-v1.1.1...@matterlabs/hardhat-zksync-solc-v1.1.2) (2024-01-25)


### Bug Fixes

* move fallback optimizing for size to optimizer section ([#687](https://github.com/matter-labs/hardhat-zksync/issues/687)) ([a1ab511](https://github.com/matter-labs/hardhat-zksync/commit/a1ab51196ec0066a37df46e1a1be0970b8152cba))

## [1.1.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-solc-v1.1.0...@matterlabs/hardhat-zksync-solc-v1.1.1) (2024-01-25)


### Fixes

* support an option to fallback to optimizing for size solc ([#660](https://github.com/matter-labs/hardhat-zksync/issues/660)) ([eaf4413](https://github.com/matter-labs/hardhat-zksync/commit/eaf44134b588ec869593b2799f9603698d7cfca2))

## [1.1.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-solc-v1.0.6...@matterlabs/hardhat-zksync-solc-v1.1.0) (2024-01-22)


### Features

* support for zkvm solc compiler ([#599](https://github.com/matter-labs/hardhat-zksync/issues/599)) ([241a6e1](https://github.com/matter-labs/hardhat-zksync/commit/241a6e11899b5d893159f71cf388417d46082351))

## [1.0.6](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-solc@1.0.5...@matterlabs/hardhat-zksync-solc-v1.0.6) (2023-12-22)


### Fixes

* **docs:** update readme files ([#612](https://github.com/matter-labs/hardhat-zksync/issues/612)) ([682338e](https://github.com/matter-labs/hardhat-zksync/commit/682338e60f52021206325ff6eeec2c394a118642))

## 1.0.5

### Patch Changes

- f4677a0: Get latest release from redirect URL

## 1.0.4

### Patch Changes

- 12fad5f:
  - Proper User-Agent for getRelease function
  - Contract source names can now match contract names without full overlap.

## 1.0.3

### Patch Changes

- fc5d370: Fetch compiler version info from the latest release

## 1.0.2

### Patch Changes

- 13419e9: Localized compiler version info data

## 1.0.1

### Patch Changes

- efbc6d8: Added CDN for compiler file version info download.

## 1.0.0

### Major Changes

- dfa0ac2: Hardhat version updates

## 0.4.2

### Patch Changes

- a079196: - Added detect-missing-library mode
  - Added release URL as primary download source for zkvyper compiler

## 0.4.1

### Patch Changes

- a1a8f8e: Enable library caching

## 0.4.0

### Minor Changes

- 224cc6c:
  - Enhanced zksolc compiler version checking mechanism.
  - Improved error handling for incorrect zksolc compiler versions.
  - Optimized validation process for zksolc compiler configuration.
  - Added informative messages for recommended and deprecated zksolc compiler versions.
  - General code optimizations and enhancements.

## 0.3.17

### Patch Changes

- 48e2699: Update solidity overrides config in the same way as compilers solidity config
- c9c91f7: Add metadata settings to zksolc config
