# @matterlabs/hardhat-zksync-upgradable

## [0.5.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v0.5.0...@matterlabs/hardhat-zksync-upgradable-v0.5.1) (2024-06-27)


### Bug Fixes

* estimateGas support for custom chains ([#1194](https://github.com/matter-labs/hardhat-zksync/issues/1194)) ([ceb9c4f](https://github.com/matter-labs/hardhat-zksync/commit/ceb9c4f1dc0fbb33b42acfa480f7012d86501c40))

## [0.5.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v0.4.1...@matterlabs/hardhat-zksync-upgradable-v0.5.0) (2024-06-20)


### Features

* switch to the default codegen with zksync solc ([#1176](https://github.com/matter-labs/hardhat-zksync/issues/1176)) ([aaa7c75](https://github.com/matter-labs/hardhat-zksync/commit/aaa7c75a1c8094d52d880f8c14d3e6bdca28b07f))

## [0.4.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v0.4.0...@matterlabs/hardhat-zksync-upgradable-v0.4.1) (2024-05-07)


### Bug Fixes

* extend deploy and upgrade of proxy with deployment type and salt ([#1042](https://github.com/matter-labs/hardhat-zksync/issues/1042)) ([b758926](https://github.com/matter-labs/hardhat-zksync/commit/b758926507e8ade096603ed0db2cb99eaefcc0dd))

## [0.4.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v0.3.1...@matterlabs/hardhat-zksync-upgradable-v0.4.0) (2024-04-03)


### Features

* bump hardhat-zksync-deploy version in the hardhat-zksync-upgradable ([f24a96c](https://github.com/matter-labs/hardhat-zksync/commit/f24a96cd154a59803b8e467918719821572ca529))
* replacing the toolbox plugin with hardhat-zksync and introducin… ([#970](https://github.com/matter-labs/hardhat-zksync/issues/970)) ([286c50d](https://github.com/matter-labs/hardhat-zksync/commit/286c50dc3ea36ff1ca277c07c8cb66200e625fc2))


### Bug Fixes

* set valid fromBlock filter to check creation tx hash from the logs ([#971](https://github.com/matter-labs/hardhat-zksync/issues/971)) ([0126c3e](https://github.com/matter-labs/hardhat-zksync/commit/0126c3ee94ef6503a50bffb0db6a8e1c3ef791fe))

## [0.3.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v0.3.0...@matterlabs/hardhat-zksync-upgradable-v0.3.1) (2024-03-14)


### Bug Fixes

* use hardhat with caret to use single version of hardhat ([#906](https://github.com/matter-labs/hardhat-zksync/issues/906)) ([edead87](https://github.com/matter-labs/hardhat-zksync/commit/edead87ed1f2e0d495918fe8b8a68d0e378b76b0))

## [0.3.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v0.2.3...@matterlabs/hardhat-zksync-upgradable-v0.3.0) (2024-03-06)


### Features

* bump hardhat-zksync-deploy and hardhat-zksync-solc dependencies in packages ([#878](https://github.com/matter-labs/hardhat-zksync/issues/878)) ([972ec4f](https://github.com/matter-labs/hardhat-zksync/commit/972ec4f44fca7619182ae3400cf209e50a45905a))


### Bug Fixes

* remove hardhat-zksync-deploy import from index.ts ([#875](https://github.com/matter-labs/hardhat-zksync/issues/875)) ([2077ac0](https://github.com/matter-labs/hardhat-zksync/commit/2077ac0e3d6801ddff8d6e072a816458e60087fd))

## [0.2.3](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v0.2.2...@matterlabs/hardhat-zksync-upgradable-v0.2.3) (2024-02-09)


### Bug Fixes

* add factory deps for implementation deployment ([#760](https://github.com/matter-labs/hardhat-zksync/issues/760)) ([ee9af05](https://github.com/matter-labs/hardhat-zksync/commit/ee9af05e7f37ef7e14e9e8cda2112306c2af9fb1))

## [0.2.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable-v0.2.1...@matterlabs/hardhat-zksync-upgradable-v0.2.2) (2024-01-31)


### Bug Fixes

* add no compile flag propagation for ethers-v5 ([#721](https://github.com/matter-labs/hardhat-zksync/issues/721)) ([32c0bf2](https://github.com/matter-labs/hardhat-zksync/commit/32c0bf227d8c3011cc0910e01cb33deba88b4125))

## [0.2.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-upgradable@0.2.0...@matterlabs/hardhat-zksync-upgradable-v0.2.1) (2024-01-29)


### Bug Fixes

* add era test node and sepolia to supported networks ([#709](https://github.com/matter-labs/hardhat-zksync/issues/709)) ([415b185](https://github.com/matter-labs/hardhat-zksync/commit/415b185182028d96ddce13a76c718290f2568f62))

## 0.2.0

### Minor Changes

- 4fe1ebb: Migration from zksync-web3 to zksync-ethers

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
