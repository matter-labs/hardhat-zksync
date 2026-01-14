# @matterlabs/hardhat-zksync-node

## [1.6.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.5.4...@matterlabs/hardhat-zksync-node-v1.6.0) (2026-01-14)


### Features

* add telemetry ([a345d09](https://github.com/matter-labs/hardhat-zksync/commit/a345d09e2150ac5b2b96b9e77edbe18dc0f3e7f4))
* bump anvil-zksync version and add new parameters ([#1709](https://github.com/matter-labs/hardhat-zksync/issues/1709)) ([99676f5](https://github.com/matter-labs/hardhat-zksync/commit/99676f533af5f0e07147242dfc5e30e19d29a33d))
* bump ethers, zksync-ethers, hardaht and other dependencies to newer versions ([#1111](https://github.com/matter-labs/hardhat-zksync/issues/1111)) ([a2d503a](https://github.com/matter-labs/hardhat-zksync/commit/a2d503abe3f504859651f22998046576eddf6579))
* get release tag from redirect url at node plugin ([#668](https://github.com/matter-labs/hardhat-zksync/issues/668)) ([5d53b27](https://github.com/matter-labs/hardhat-zksync/commit/5d53b270428fc3bd7a6338d0bab38a7f52d485d1))
* override run task for zksync hardhat network ([#1462](https://github.com/matter-labs/hardhat-zksync/issues/1462)) ([a49c593](https://github.com/matter-labs/hardhat-zksync/commit/a49c5932abcb7e5244314471c9b7f701c1c90a20))
* set default version and handle github repo redirects ([#1577](https://github.com/matter-labs/hardhat-zksync/issues/1577)) ([fcf16d2](https://github.com/matter-labs/hardhat-zksync/commit/fcf16d21f67ed5212669ead7ae183adb155a1007))
* show contract logs while running tests and scripts with zksync hadrhat node ([e510ad1](https://github.com/matter-labs/hardhat-zksync/commit/e510ad11c98071b8781751eba792eb60616dcd74))
* switch to the default codegen with zksolc ([#1062](https://github.com/matter-labs/hardhat-zksync/issues/1062)) ([5ec997a](https://github.com/matter-labs/hardhat-zksync/commit/5ec997aaa83ba18d978f10b96f489513f6c4dd9f))


### Bug Fixes

* add offline mode to global and rename emulateEVM to corrected name ([8ac15f1](https://github.com/matter-labs/hardhat-zksync/commit/8ac15f19f9d7bcce1b76ce8dae6752ab3691fda2))
* add type extension to the index ([#1651](https://github.com/matter-labs/hardhat-zksync/issues/1651)) ([1304495](https://github.com/matter-labs/hardhat-zksync/commit/130449550c9096dee56015b12c59255d8a3cc390))
* anvil-zksync bumped default version ([#1751](https://github.com/matter-labs/hardhat-zksync/issues/1751)) ([4279487](https://github.com/matter-labs/hardhat-zksync/commit/4279487f409e45ac8767d50cbf9644455d9be5cb))
* apply anvil cli args with values ([291e80a](https://github.com/matter-labs/hardhat-zksync/commit/291e80a4bea49864840bebf602942e5a3a87978b))
* create node cache directory with permissions ([#1642](https://github.com/matter-labs/hardhat-zksync/issues/1642)) ([8711e0e](https://github.com/matter-labs/hardhat-zksync/commit/8711e0e2eb3076abecaeb511f44877b258183e09))
* noop commit to trigger release ([#1834](https://github.com/matter-labs/hardhat-zksync/issues/1834)) ([596f736](https://github.com/matter-labs/hardhat-zksync/commit/596f73688f1bf67fe30083e6197ad1bf2abda1c7))
* properly constructor fork arguments ([#927](https://github.com/matter-labs/hardhat-zksync/issues/927)) ([bfe8970](https://github.com/matter-labs/hardhat-zksync/commit/bfe897019bae72abd1ae0f3d6f69c2c4bb6038cd))
* remove zksync-ethers dependency  ([#920](https://github.com/matter-labs/hardhat-zksync/issues/920)) ([d4a1ac8](https://github.com/matter-labs/hardhat-zksync/commit/d4a1ac80727d9de38460373cd07245ba2b747eea))
* rename silent param to quiet ([#1759](https://github.com/matter-labs/hardhat-zksync/issues/1759)) ([28fc526](https://github.com/matter-labs/hardhat-zksync/commit/28fc5262763158ee3fd350260163323eb5d1d84a))
* tests ([8a7d79c](https://github.com/matter-labs/hardhat-zksync/commit/8a7d79ce5483c3ed14a66dfc4dcc554d74e8c5f0))
* tests ([0e07b7e](https://github.com/matter-labs/hardhat-zksync/commit/0e07b7e0c8a26f2152229fc6f0efb4181b7dd3a4))
* tests ([fd15f32](https://github.com/matter-labs/hardhat-zksync/commit/fd15f32f75b924d9e95c0d6a38367a9fdcf89150))
* update links to new doc site ([276740b](https://github.com/matter-labs/hardhat-zksync/commit/276740ba5abf8b5775e135b5653824d6456a7e4f))
* update naming from era_test_node to anvil-zksync ([6bfb1c2](https://github.com/matter-labs/hardhat-zksync/commit/6bfb1c26f8f01ecd1a3095d97b7858dfef8bb06a))
* update naming from era_test_node to anvil-zksync ([d484fdd](https://github.com/matter-labs/hardhat-zksync/commit/d484fdda713d9c246c4a4639b6d6af84f63ceb15))
* update release url for anvil-zksync and era-test-node releases ([b57b9cc](https://github.com/matter-labs/hardhat-zksync/commit/b57b9cc3ab1e638901901120b91761666b8761af))

## [1.5.3](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.5.2...@matterlabs/hardhat-zksync-node-v1.5.3) (2025-08-11)


### Bug Fixes

* noop commit to trigger release ([#1834](https://github.com/matter-labs/hardhat-zksync/issues/1834)) ([596f736](https://github.com/matter-labs/hardhat-zksync/commit/596f73688f1bf67fe30083e6197ad1bf2abda1c7))

## [1.5.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.5.1...@matterlabs/hardhat-zksync-node-v1.5.2) (2025-06-23)


### Bug Fixes

* add offline mode to global and rename emulateEVM to corrected name ([8ac15f1](https://github.com/matter-labs/hardhat-zksync/commit/8ac15f19f9d7bcce1b76ce8dae6752ab3691fda2))

## [1.5.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.5.0...@matterlabs/hardhat-zksync-node-v1.5.1) (2025-05-16)


### Bug Fixes

* rename silent param to quiet ([#1759](https://github.com/matter-labs/hardhat-zksync/issues/1759)) ([28fc526](https://github.com/matter-labs/hardhat-zksync/commit/28fc5262763158ee3fd350260163323eb5d1d84a))

## [1.5.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.4.1...@matterlabs/hardhat-zksync-node-v1.5.0) (2025-05-12)


### Features

* bump anvil-zksync version and add new parameters ([#1709](https://github.com/matter-labs/hardhat-zksync/issues/1709)) ([99676f5](https://github.com/matter-labs/hardhat-zksync/commit/99676f533af5f0e07147242dfc5e30e19d29a33d))

## [1.4.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.4.0...@matterlabs/hardhat-zksync-node-v1.4.1) (2025-05-09)


### Bug Fixes

* anvil-zksync bumped default version ([#1751](https://github.com/matter-labs/hardhat-zksync/issues/1751)) ([4279487](https://github.com/matter-labs/hardhat-zksync/commit/4279487f409e45ac8767d50cbf9644455d9be5cb))

## [1.4.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.3.1...@matterlabs/hardhat-zksync-node-v1.4.0) (2025-03-25)


### Features

* add telemetry ([a345d09](https://github.com/matter-labs/hardhat-zksync/commit/a345d09e2150ac5b2b96b9e77edbe18dc0f3e7f4))

## [1.3.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.3.0...@matterlabs/hardhat-zksync-node-v1.3.1) (2025-03-03)


### Bug Fixes

* add type extension to the index ([#1651](https://github.com/matter-labs/hardhat-zksync/issues/1651)) ([1304495](https://github.com/matter-labs/hardhat-zksync/commit/130449550c9096dee56015b12c59255d8a3cc390))
* create node cache directory with permissions ([#1642](https://github.com/matter-labs/hardhat-zksync/issues/1642)) ([8711e0e](https://github.com/matter-labs/hardhat-zksync/commit/8711e0e2eb3076abecaeb511f44877b258183e09))

## [1.3.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.2.1...@matterlabs/hardhat-zksync-node-v1.3.0) (2025-02-24)


### Features

* set default version and handle github repo redirects ([#1577](https://github.com/matter-labs/hardhat-zksync/issues/1577)) ([fcf16d2](https://github.com/matter-labs/hardhat-zksync/commit/fcf16d21f67ed5212669ead7ae183adb155a1007))


### Bug Fixes

* apply anvil cli args with values ([291e80a](https://github.com/matter-labs/hardhat-zksync/commit/291e80a4bea49864840bebf602942e5a3a87978b))
* tests ([8a7d79c](https://github.com/matter-labs/hardhat-zksync/commit/8a7d79ce5483c3ed14a66dfc4dcc554d74e8c5f0))

## [1.2.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.2.0...@matterlabs/hardhat-zksync-node-v1.2.1) (2024-12-10)


### Bug Fixes

* tests ([0e07b7e](https://github.com/matter-labs/hardhat-zksync/commit/0e07b7e0c8a26f2152229fc6f0efb4181b7dd3a4))
* update naming from era_test_node to anvil-zksync ([6bfb1c2](https://github.com/matter-labs/hardhat-zksync/commit/6bfb1c26f8f01ecd1a3095d97b7858dfef8bb06a))
* update naming from era_test_node to anvil-zksync ([d484fdd](https://github.com/matter-labs/hardhat-zksync/commit/d484fdda713d9c246c4a4639b6d6af84f63ceb15))
* update release url for anvil-zksync and era-test-node releases ([b57b9cc](https://github.com/matter-labs/hardhat-zksync/commit/b57b9cc3ab1e638901901120b91761666b8761af))

## [1.2.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.1.1...@matterlabs/hardhat-zksync-node-v1.2.0) (2024-10-24)


### Features

* override run task for zksync hardhat network ([#1462](https://github.com/matter-labs/hardhat-zksync/issues/1462)) ([a49c593](https://github.com/matter-labs/hardhat-zksync/commit/a49c5932abcb7e5244314471c9b7f701c1c90a20))


### Bug Fixes

* update links to new doc site ([276740b](https://github.com/matter-labs/hardhat-zksync/commit/276740ba5abf8b5775e135b5653824d6456a7e4f))

## [1.1.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.1.0...@matterlabs/hardhat-zksync-node-v1.1.1) (2024-07-15)


### Bug Fixes

* remove zksync-ethers dependency  ([#920](https://github.com/matter-labs/hardhat-zksync/issues/920)) ([d4a1ac8](https://github.com/matter-labs/hardhat-zksync/commit/d4a1ac80727d9de38460373cd07245ba2b747eea))

## [1.1.0](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.0.3...@matterlabs/hardhat-zksync-node-v1.1.0) (2024-06-19)


### Features

* bump ethers, zksync-ethers, hardaht and other dependencies to newer versions ([#1111](https://github.com/matter-labs/hardhat-zksync/issues/1111)) ([a2d503a](https://github.com/matter-labs/hardhat-zksync/commit/a2d503abe3f504859651f22998046576eddf6579))
* switch to the default codegen with zksolc ([#1062](https://github.com/matter-labs/hardhat-zksync/issues/1062)) ([5ec997a](https://github.com/matter-labs/hardhat-zksync/commit/5ec997aaa83ba18d978f10b96f489513f6c4dd9f))

## [1.0.3](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node@1.0.2...@matterlabs/hardhat-zksync-node-v1.0.3) (2024-03-21)


### Bug Fixes

* properly constructor fork arguments ([#927](https://github.com/matter-labs/hardhat-zksync/issues/927)) ([bfe8970](https://github.com/matter-labs/hardhat-zksync/commit/bfe897019bae72abd1ae0f3d6f69c2c4bb6038cd))

## [1.0.2](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node-v1.0.1...@matterlabs/hardhat-zksync-node-v1.0.2) (2024-02-01)


### Bug Fixes

* get release tag from redirect url at node plugin ([#668](https://github.com/matter-labs/hardhat-zksync/issues/668)) ([5d53b27](https://github.com/matter-labs/hardhat-zksync/commit/5d53b270428fc3bd7a6338d0bab38a7f52d485d1))

## [1.0.1](https://github.com/matter-labs/hardhat-zksync/compare/@matterlabs/hardhat-zksync-node@1.0.0...@matterlabs/hardhat-zksync-node-v1.0.1) (2023-12-22)


### Fixes

* **docs:** update readme files ([#612](https://github.com/matter-labs/hardhat-zksync/issues/612)) ([682338e](https://github.com/matter-labs/hardhat-zksync/commit/682338e60f52021206325ff6eeec2c394a118642))

## 1.0.0

### Major Changes

- f216797: Migration from zksync2-js to zksync-ethers
