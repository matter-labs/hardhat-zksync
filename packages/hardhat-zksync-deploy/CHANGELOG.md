# @matterlabs/hardhat-zksync-deploy

## [1.6.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-deploy-v1.5.0...@matterlabs/hardhat-zksync-deploy-v1.6.0) (2024-10-24)


### Features

* introducing ethers extension in hre ([#1283](https://github.com/matter-labs/hardhat-zksync/issues/1283)) ([8e471bc](https://github.com/matter-labs/hardhat-zksync/commit/8e471bcbbbf1ee712fe79cd5d5782c11e52e3b75))
* override run task for zksync hardhat network ([#1462](https://github.com/matter-labs/hardhat-zksync/issues/1462)) ([a49c593](https://github.com/matter-labs/hardhat-zksync/commit/a49c5932abcb7e5244314471c9b7f701c1c90a20))


### Bug Fixes

* update links to new doc site ([276740b](https://github.com/matter-labs/hardhat-zksync/commit/276740ba5abf8b5775e135b5653824d6456a7e4f))

## [1.5.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-deploy-v1.4.0...@matterlabs/hardhat-zksync-deploy-v1.5.0) (2024-06-19)


### Features

* bump ethers, zksync-ethers, hardaht and other dependencies to newer versions ([#1111](https://github.com/matter-labs/hardhat-zksync/issues/1111)) ([a2d503a](https://github.com/matter-labs/hardhat-zksync/commit/a2d503abe3f504859651f22998046576eddf6579))
* switch to the default codegen with zksolc ([#1062](https://github.com/matter-labs/hardhat-zksync/issues/1062)) ([5ec997a](https://github.com/matter-labs/hardhat-zksync/commit/5ec997aaa83ba18d978f10b96f489513f6c4dd9f))

## [1.4.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-deploy-v1.3.0...@matterlabs/hardhat-zksync-deploy-v1.4.0) (2024-05-28)


### Features

* use deployment type in the deploy function ([#1090](https://github.com/matter-labs/hardhat-zksync/issues/1090)) ([05b2262](https://github.com/matter-labs/hardhat-zksync/commit/05b2262ff148369297c2098a95775d265b3efd41))

## [1.3.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-deploy-v1.2.1...@matterlabs/hardhat-zksync-deploy-v1.3.0) (2024-04-04)


### Features

* introducing a new deploy-zksync:contract task to compile and deploy one contract ([#987](https://github.com/matter-labs/hardhat-zksync/issues/987)) ([7f983e2](https://github.com/matter-labs/hardhat-zksync/commit/7f983e2dbc28b072901403e0f375ef798716129e))

## [1.2.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-deploy-v1.2.0...@matterlabs/hardhat-zksync-deploy-v1.2.1) (2024-03-04)


### Bug Fixes

* set forceDeploy to true as a default value ([#848](https://github.com/matter-labs/hardhat-zksync/issues/848)) ([326b94f](https://github.com/matter-labs/hardhat-zksync/commit/326b94f3192ae1177f5b92c186c458df246f865e))
* support for non-inline libraries 'export default' expressions and zksolc is not reqired for config update ([#853](https://github.com/matter-labs/hardhat-zksync/issues/853)) ([dbfe6af](https://github.com/matter-labs/hardhat-zksync/commit/dbfe6af0590d85da877a6f541244492fc0efcb67))
* update deploy cache logic, script load path support for windows ([#865](https://github.com/matter-labs/hardhat-zksync/issues/865)) ([c30e276](https://github.com/matter-labs/hardhat-zksync/commit/c30e276903e97b12283bb742659e513bdb9dafe6))

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
