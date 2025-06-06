# @matterlabs/hardhat-zksync-vyper

## [1.3.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-vyper-v1.2.1...@matterlabs/hardhat-zksync-vyper-v1.3.0) (2025-06-06)


### Features

* throw errors for older versions of the compiler ([#1770](https://github.com/matter-labs/hardhat-zksync/issues/1770)) ([19ddeb2](https://github.com/matter-labs/hardhat-zksync/commit/19ddeb26796da51adf4b0f1d895ef754424b6bf9))

## [1.2.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-vyper-v1.2.0...@matterlabs/hardhat-zksync-vyper-v1.2.1) (2025-05-09)


### Bug Fixes

* add check for local binary compiler ([318cce4](https://github.com/matter-labs/hardhat-zksync/commit/318cce4f585e5fc8741e7405e072dd1b9146a874))
* add warnings for depricated versions ([1db166c](https://github.com/matter-labs/hardhat-zksync/commit/1db166c7eea0563e3aba242e6261d854d2c793fc))

## [1.2.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-vyper-v1.1.1...@matterlabs/hardhat-zksync-vyper-v1.2.0) (2025-03-25)


### Features

* add telemetry ([a345d09](https://github.com/matter-labs/hardhat-zksync/commit/a345d09e2150ac5b2b96b9e77edbe18dc0f3e7f4))

## [1.1.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-vyper-v1.1.0...@matterlabs/hardhat-zksync-vyper-v1.1.1) (2024-10-21)


### Bug Fixes

* download zkvyper if needed before compilation ([#1484](https://github.com/matter-labs/hardhat-zksync/issues/1484)) ([9763aba](https://github.com/matter-labs/hardhat-zksync/commit/9763aba2c84cc2c53915e1aa9ca9e3be81ea083e))

## [1.1.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-vyper-v1.0.8...@matterlabs/hardhat-zksync-vyper-v1.1.0) (2024-09-05)


### Features

* bump ethers, zksync-ethers, hardaht and other dependencies to newer versions ([#1111](https://github.com/matter-labs/hardhat-zksync/issues/1111)) ([a2d503a](https://github.com/matter-labs/hardhat-zksync/commit/a2d503abe3f504859651f22998046576eddf6579))


### Bug Fixes

* add gnu toolchain for linux as default from compiler version 1.5.4 ([#1359](https://github.com/matter-labs/hardhat-zksync/issues/1359)) ([4272477](https://github.com/matter-labs/hardhat-zksync/commit/4272477e9a132ba7f36c24a14a4ac15ea65f1c65))
* update links to new doc site ([276740b](https://github.com/matter-labs/hardhat-zksync/commit/276740ba5abf8b5775e135b5653824d6456a7e4f))

## [1.0.8](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-vyper-v1.0.7...@matterlabs/hardhat-zksync-vyper-v1.0.8) (2024-02-26)


### Bug Fixes

* set zkvyper compiler version for specified compiler path ([#817](https://github.com/matter-labs/hardhat-zksync/issues/817)) ([293dfba](https://github.com/matter-labs/hardhat-zksync/commit/293dfba9287ab94400a954784093a2b5720ca716))
* support new naming for proxy at forwarder contracts ([#809](https://github.com/matter-labs/hardhat-zksync/issues/809)) ([1e31289](https://github.com/matter-labs/hardhat-zksync/commit/1e31289d3011f5e71a843455a12ba1062f1d6050))

## [1.0.7](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-vyper-v1.0.6...@matterlabs/hardhat-zksync-vyper-v1.0.7) (2024-01-25)


### Bug Fixes

* support an option to fallback to optimizing for size vyper ([#674](https://github.com/matter-labs/hardhat-zksync/issues/674)) ([bb95025](https://github.com/matter-labs/hardhat-zksync/commit/bb95025f966e11466684b79f833d8cd3ce81f931))

## [1.0.6](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-vyper-v1.0.5...@matterlabs/hardhat-zksync-vyper-v1.0.6) (2024-01-15)


### Bug Fixes

* windows path normalize with compiler ([#663](https://github.com/matter-labs/hardhat-zksync/issues/663)) ([603d2dd](https://github.com/matter-labs/hardhat-zksync/commit/603d2dd089329a00163399925088a898fe1647ea))

## [1.0.5](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-vyper@1.0.4...@matterlabs/hardhat-zksync-vyper-v1.0.5) (2023-12-22)


### Fixes

* **docs:** update readme files ([#612](https://github.com/matter-labs/hardhat-zksync/issues/612)) ([682338e](https://github.com/matter-labs/hardhat-zksync/commit/682338e60f52021206325ff6eeec2c394a118642))
* **hardhat-zksync-vyper:** Fixed windows compile paths ([#479](https://github.com/matter-labs/hardhat-zksync/issues/479)) ([4859b29](https://github.com/matter-labs/hardhat-zksync/commit/4859b293ad53ca608df277ddb349dae6d1237394))

## 1.0.4

### Patch Changes

- 0b97bb4: - Get latest release from redirect URL
  - Change User Agent

## 1.0.3

### Patch Changes

- f738148: Fetch compiler version info from the latest release

## 1.0.2

### Patch Changes

- 67892c0: Localized compiler version data

## 1.0.1

### Patch Changes

- aa21c21: Added cdn link for downloading vyper compiler

## 1.0.0

### Major Changes

- dfa0ac2: Hardhat version updates

## 0.2.2

### Patch Changes

- da5eee8: Add logging of zkvyper compilation warnings

## 0.2.1

### Patch Changes

- 3407adc: Add release URL as primary download source for zkvyper compiler

## 0.2.0

### Minor Changes

- 6ff144f:
  - Enhanced zkvyper compiler version checking mechanism.
  - Improved error handling for incorrect zkvyper compiler versions.
  - Optimized validation process for zkvyper compiler configuration.
  - Added informative messages for recommended and deprecated zkvyper compiler versions.
  - General code optimizations and enhancements.
