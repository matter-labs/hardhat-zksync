# hardhat-zksync 🚀

zkSync Era [Hardhat](https://hardhat.org/) plugin provides a convenient method for bundling and accessing a range of zkSync-related Hardhat plugins.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

## ⚠️ Version Compatibility Warning

Ensure you are using the correct version of the plugin with ethers:
- For plugin version **<1.0.0**:
  - Compatible with ethers **v5**.

- For plugin version **≥1.0.0**:
  - Compatible with ethers **v6** (⭐ Recommended)

## 📥 Installation

To install **hardhat-zksync** plugin, run:

`npm i -D @matterlabs/hardhat-zksync`

or

`yarn add -D @matterlabs/hardhat-zksync`

## Usage

Here is an overview of the plugins currently available in this package when installed:

| 🔌 Plugin                     | 📄 Description                                                                                                                    |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| hardhat-zksync-solc           | Simplifies compiling Solidity contracts for the zkSync network, streamlining deployment preparation.                              |
| hardhat-zksync-deploy         | Facilitates the deployment of contracts on zkSync, utilizing artifacts from hardhat-zksync-solc.                            |
| hardhat-zksync-verify         | Automates the process of verifying smart contracts on the zkSync network, enhancing transparency and trust.                       |
| hardhat-zksync-upgradeable    | Enables easier deployment and upgrading of smart contracts on the zkSync network, improving contract lifecycle management.        |
| hardhat-zksync-node           | Convenient plugin to run the zkSync era-test-node locally.                                                                        |
| hardhat-zksync-ethers         | A zksync-ethers SDK wrapper providing additional methods for accelerated development on zkSync.                                   |


This plugin enables access to all commands available for each specific plugin, making them readily accessible with just the usage of this plugin. To view the available commands and their descriptions, please refer to the [documentation](https://v2-docs.zksync.io/api/hardhat/plugins.html#plugins) for each individual plugin.

For certain tasks present in the plugins encompassed by this plugin, it overrides them with new features and parameters. These tasks streamline common functionalities into a simplified workflow.

Here is a list of overriden tasks where this plugin adds new optional parameter `--verify`:

- `deploy-zksync:contract`
- `deploy-zksync:proxy` 
- `upgrade-zksync:proxy`
- `deploy-zksync:beacon`
- `upgrade-zksync:beacon`

The `--verify` parameter allow the task to immediately verify all deployed and upgraded contracts when task is called.

To check other parameters present in these tasks, please check the documentation pages for [hardhat-zksync-deploy](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-deploy.html) and [hardhat-zksync-upgradable](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-upgradable.html).

## 📝 Documentation

In addition to the [hardhat-zksync](http://docs.zksync.io/build/tooling/hardhat/hardhat-zksync.html), zkSync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

[Guides to get started](https://era.zksync.io/docs/dev/building-on-zksync/hello-world.html): Learn how to start building on zkSync Era.\
[Hardhat zkSync Era plugins](https://era.zksync.io/docs/tools/hardhat/getting-started.html): Overview and guides for all Hardhat zkSync Era plugins.\
[Hyperscaling](https://era.zksync.io/docs/reference/concepts/hyperscaling.html#what-are-hyperchains): Deep dive into hyperscaling on zkSync Era.

## 🤝 Contributing

Contributions are always welcome! Feel free to open any issue or send a pull request.

Go to [CONTRIBUTING.md](https://github.com/matter-labs/hardhat-zksync/blob/main/.github/CONTRIBUTING.md) to learn about steps and best practices for contributing to zkSync hardhat tooling base repository.  


## 🙌 Feedback, help and news

[zkSync Era Discord server](https://join.zksync.dev/): for questions and feedback.\
[Follow zkSync Era on Twitter](https://twitter.com/zksync)

## Happy building! 👷‍♀️👷‍♂️