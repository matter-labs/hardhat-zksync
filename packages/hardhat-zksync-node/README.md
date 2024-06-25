# hardhat-zksync-node 🚀

ZKsync Era [Hardhat](https://hardhat.org/) plugin to run the ZKsync era-test-node locally.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

## ⚠️ Version Compatibility Warning

Ensure you are using the correct version of the plugin with ethers:
- For plugin version **<1.0.0**:
  - Compatible with ethers **v5**.

- For plugin version **≥1.0.0**:
  - Compatible with ethers **v6** (⭐ Recommended)

## 📥 Installation

To install **hardhat-zksync-node** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-node`

or

`yarn add -D @matterlabs/hardhat-zksync-node`

## 🕹 Commands

`yarn hardhat node-zksync`

This command runs a local ZKsync In-memory node by initiating a JSON-RPC server. It uses the provided or default configurations to set up and run the ZKsync node, allowing for blockchain operations in a local environment. The command also handles tasks such as downloading the necessary JSON-RPC server binary if it's not already present.

| 🔧 Command                          | 📄 Description                                                                                                       |
|-------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| --port                              | Port on which the server should listen. Defaults to 8011.                                                            |
| --log                               | Log filter level. Accepted values are: error, warn, info, and debug. Defaults to info.                               |
| --log-file-path                     | Path to the file where logs should be written. Defaults to era_test_node.log                                         |
| --cache                             | Type of cache to use. Accepted values are: none, disk, and memory. Defaults to disk.                                 |
| --cache-dir                         | Directory location for the disk cache. Defaults to .cache                                                            |
| --reset-cache                       | Flag to reset the local disk cache.                                                                                  |
| --show-calls                        | Determines which call debug information to show. Accepted values are: none, user, system, and all. Defaults to none. |
| --show-storage-logs                 | Determines which storage logs to show. Accepted values are: none, read, write, and all. Defaults to none.            |
| --show-vm-details                   | Specifies the level of Virtual Machine (VM) details to show. Accepted values are: none and all. Defaults to none.    |
| --show-gas-details                  | Specifies the level of gas details to show. Accepted values are: none and all. Defaults to none.                     |
| --resolve-hashes                    | When enabled, it makes the debug log more readable but might decrease performance.                                   |
| --dev-use-local-contracts           | Flag to load locally compiled system contracts. Useful when making changes to system contracts or bootloader.        |
| ---fork                             | Starts a local network that is a fork of another network. Accepted values are: testnet, mainnet, or a specific URL.  |
| --fork-block-number                 | Specifies the block height at which to fork.                                                                         |
| --replay-tx                         | Transaction hash to replay.                                                                                          |

**Restrictions**: The --replay-tx and --fork-block-number parameters cannot be specified simultaneously.

## 📝 Documentation

In addition to the [hardhat-zksync-node](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-node.html), ZKsync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

[Guides to get started](https://era.zksync.io/docs/dev/building-on-zksync/hello-world.html): Learn how to start building on ZKsync Era.\
[Hardhat ZKsync Era plugins](https://era.zksync.io/docs/tools/hardhat/getting-started.html): Overview and guides for all Hardhat ZKsync Era plugins.\
[Hyperscaling](https://era.zksync.io/docs/reference/concepts/hyperscaling.html#what-are-hyperchains): Deep dive into hyperscaling on ZKsync Era.

## 🤝 Contributing

Contributions are always welcome! Feel free to open any issue or send a pull request.

Go to [CONTRIBUTING.md](https://github.com/matter-labs/hardhat-zksync/blob/main/.github/CONTRIBUTING.md) to learn about steps and best practices for contributing to ZKsync hardhat tooling base repository.  


## 🙌 Feedback, help and news

[ZKsync Era Discord server](https://join.zksync.dev/): for questions and feedback.\
[Follow ZKsync Era on Twitter](https://twitter.com/zksync)

## Happy building! 👷‍♀️👷‍♂️