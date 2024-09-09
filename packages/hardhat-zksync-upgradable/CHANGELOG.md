# @matterlabs/hardhat-zksync-upgradable

## [1.7.0-beta.3](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.6.0-beta.3...@matterlabs/hardhat-zksync-upgradable-v1.7.0-beta.3) (2024-09-09)


### Features

* bump openzeppelin contracts to v5 ([cbd0262](https://github.com/matter-labs/hardhat-zksync/commit/cbd026216043106172c39360a4f9ddeefdb33ab6))
* bump openzeppelin contracts to v5 ([2479f87](https://github.com/matter-labs/hardhat-zksync/commit/2479f8731e65923fde00346fb595bd5525401c6e))


### Bug Fixes

* remove unsafeAllow for uups proxies ([58815f7](https://github.com/matter-labs/hardhat-zksync/commit/58815f749be81bc7e7ac458e4a163cfaa5fc215a))
* revert manifest and storage layout ([50b46c1](https://github.com/matter-labs/hardhat-zksync/commit/50b46c14ac4baeea4414996b175abab7a07bf93a))
* revert oz contracts for basic example and update readme file ([bc4368a](https://github.com/matter-labs/hardhat-zksync/commit/bc4368a4517d6485d9c9aee6d5c178f8cfc7e163))

## [1.6.0-beta.3](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.6.0-beta.2...@matterlabs/hardhat-zksync-upgradable-v1.6.0-beta.3) (2024-08-28)


### Bug Fixes

* change paymaster params to PaymasterParams from zksync-ethers ([438e834](https://github.com/matter-labs/hardhat-zksync/commit/438e83403395b4654edb2a398a1c232c11440972))

## [1.6.0-beta.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.6.0-beta.1...@matterlabs/hardhat-zksync-upgradable-v1.6.0-beta.2) (2024-08-28)


### Bug Fixes

* add paymaster params for admin and add other custom data ([ee97c23](https://github.com/matter-labs/hardhat-zksync/commit/ee97c23f223aa9517e74fcd530e3b8503f8454fd))
* add paymaster params for proxy and implementation deployment ([dfb12bc](https://github.com/matter-labs/hardhat-zksync/commit/dfb12bce87ad73b7f4c9b01585e5158dd0a99d8f))
* add verify for non zksync networks ([9005368](https://github.com/matter-labs/hardhat-zksync/commit/9005368cd19d63735930cbacdd78b43113894220))
* change custom data for proxy admin ([671feb4](https://github.com/matter-labs/hardhat-zksync/commit/671feb4df430918829b42902b0b0d5023e2dd1a5))
* change custom data for proxy admin ([6678eb1](https://github.com/matter-labs/hardhat-zksync/commit/6678eb17ec2b31e3d6ae173fbb29a2465ad17b79))

## [1.6.0-beta.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.5.2-beta.1...@matterlabs/hardhat-zksync-upgradable-v1.6.0-beta.1) (2024-08-26)


### Features

* add upgrades extension in hre ([5280788](https://github.com/matter-labs/hardhat-zksync/commit/5280788c20035b99e0b9a2ea8211d923a016c245))

## [1.5.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.5.1...@matterlabs/hardhat-zksync-upgradable-v1.5.2) (2024-08-04)


### Bug Fixes

* use openzepplin/contracts as alias and remove unvalid peer depen… ([#1272](https://github.com/matter-labs/hardhat-zksync/issues/1272)) ([835ca4a](https://github.com/matter-labs/hardhat-zksync/commit/835ca4ac3eac61e085d83283f4ef2e6669fd5c24))

## [1.5.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.5.0...@matterlabs/hardhat-zksync-upgradable-v1.5.1) (2024-06-27)


### Bug Fixes

* estimateGas support for custom chains ([#1193](https://github.com/matter-labs/hardhat-zksync/issues/1193)) ([6515c7d](https://github.com/matter-labs/hardhat-zksync/commit/6515c7d5e9c70e7dc393d531c56b613ba714af18))

## [1.5.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.4.1...@matterlabs/hardhat-zksync-upgradable-v1.5.0) (2024-06-19)


### Features

* bump ethers, zksync-ethers, hardaht and other dependencies to newer versions ([#1111](https://github.com/matter-labs/hardhat-zksync/issues/1111)) ([a2d503a](https://github.com/matter-labs/hardhat-zksync/commit/a2d503abe3f504859651f22998046576eddf6579))
* switch to the default codegen with zksolc ([#1062](https://github.com/matter-labs/hardhat-zksync/issues/1062)) ([5ec997a](https://github.com/matter-labs/hardhat-zksync/commit/5ec997aaa83ba18d978f10b96f489513f6c4dd9f))

## [1.4.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v1.4.0...@matterlabs/hardhat-zksync-upgradable-v1.4.1) (2024-05-07)


### Bug Fixes

* extend deploy and upgrade of proxy with deployment type and salt ([#1041](https://github.com/matter-labs/hardhat-zksync/issues/1041)) ([514f8b6](https://github.com/matter-labs/hardhat-zksync/commit/514f8b6e40470e3a9f82d974ccc6a5c589914db9))

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
