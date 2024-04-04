# @matterlabs/hardhat-zksync-upgradable

## [1.4.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.3.1...@matterlabs/hardhat-zksync-upgradable-v1.4.0) (2024-04-04)


### Features

* bump hardhat-zksync-deploy dependency version ([#990](https://github.com/matter-labs/hardhat-zksync/issues/990)) ([76362bf](https://github.com/matter-labs/hardhat-zksync/commit/76362bf435a2af5294a9106370f9c9faaaccdd17))
* introducing a new tasks to compile,deploy and upgrade contracts ([#989](https://github.com/matter-labs/hardhat-zksync/issues/989)) ([44efdbb](https://github.com/matter-labs/hardhat-zksync/commit/44efdbb5aff55af1a8f7ab0cf514c2a88a042db4))


### Bug Fixes

* set valid fromBlock filter to check creation tx hash from the logs ([#975](https://github.com/matter-labs/hardhat-zksync/issues/975)) ([d381d11](https://github.com/matter-labs/hardhat-zksync/commit/d381d1182ded014339c247d21bc586a1cb9623de))

## [1.3.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.3.0...@matterlabs/hardhat-zksync-upgradable-v1.3.1) (2024-03-06)


### Bug Fixes

* remove unnecessary devDependencies, remove hardhat-zksync-deploy import from index.ts ([#870](https://github.com/matter-labs/hardhat-zksync/issues/870)) ([8955d34](https://github.com/matter-labs/hardhat-zksync/commit/8955d3481c48b8fbe0034485e7b675cee57d7455))

## [1.3.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.2.4...@matterlabs/hardhat-zksync-upgradable-v1.3.0) (2024-02-26)


### Features

* bump hardhat-zksync-deploy and hardhat-zksync-solc dependencies… ([#840](https://github.com/matter-labs/hardhat-zksync/issues/840)) ([b570877](https://github.com/matter-labs/hardhat-zksync/commit/b570877c78c74f3c88c7e62498e5f477d4ada616))

## [1.2.4](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.2.3...@matterlabs/hardhat-zksync-upgradable-v1.2.4) (2024-02-05)


### Bug Fixes

* add factory deps for implementation deployment ([#756](https://github.com/matter-labs/hardhat-zksync/issues/756)) ([65df2c2](https://github.com/matter-labs/hardhat-zksync/commit/65df2c21a5446f46a32cebf4bb450385c04b0086))

## [1.2.3](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.2.2...@matterlabs/hardhat-zksync-upgradable-v1.2.3) (2024-01-31)


### Bug Fixes

* add no compile flag propagation ([#720](https://github.com/matter-labs/hardhat-zksync/issues/720)) ([2cdc982](https://github.com/matter-labs/hardhat-zksync/commit/2cdc982e31f6816feecc585e57354c08800b44d6))

## [1.2.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.2.1...@matterlabs/hardhat-zksync-upgradable-v1.2.2) (2024-01-29)


### Bug Fixes

* add support for sepolia and zksync era test node ([#705](https://github.com/matter-labs/hardhat-zksync/issues/705)) ([d2ab4aa](https://github.com/matter-labs/hardhat-zksync/commit/d2ab4aa6f469e4ecb7531f516b38c1f64bf0ca6f))

## [1.2.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable@1.2.0...@matterlabs/hardhat-zksync-upgradable-v1.2.1) (2023-12-22)


### Fixes

* **docs:** update readme files ([#612](https://github.com/matter-labs/hardhat-zksync/issues/612)) ([682338e](https://github.com/matter-labs/hardhat-zksync/commit/682338e60f52021206325ff6eeec2c394a118642))

## 1.2.0

### Minor Changes

- f216797: Migration from zksync2-js to zksync-ethers

## 1.1.0

### Minor Changes

- 72342e0: Bumped versions of dependencies.

## 1.0.0

### Major Changes

- d673e3bc: Migrated from zksync-web3 to zksync2-js and updated dependencies on hardhat and ethers.

## 0.1.3

### Patch Changes

- a79f478: Fixed openzeppelin packages import issue by adding the fixed dependency

## 0.1.2

### Patch Changes

- 1341a00: Added `quiet` parameter for deploy proxy and upgrade proxy functionalities

## 0.1.1

### Patch Changes

- 463c5f4: Added proxy deployment gas estimation

## 0.1.0

### Patch Changes

- 090cda9:
  - Transparent, UUPS and beacon proxies support
  - Proxy contracts verification support
  - Upgrade validations support
