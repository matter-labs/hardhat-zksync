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

## 🕹 Commands

### Contract deployment shortcuts 

`yarn hardhat deploy-zksync:oneline --contract-name <contract name or fully qualified name> <constructor arguments> [--verify] [--no-compile]`

When executed, this command deploys the provided contract on the specified network, using the provided contract constructor arguments. Using the `verify` parameter verifies the contract after deployment, while `no-compile` skips the compilation process.

### Contract upgrades shortcuts 

`yarn hardhat deploy-beacon:oneline --contract-name <contract name or fully qualified name> <constructor arguments> [--no-compile]`

When executed, this command deploys the provided implementation, beacon and proxy on the specified network, using the provided contract constructor arguments. Optionally, the `no-compile` parameter allows the task to skip the compilation process.

`yarn hardhat deploy-proxy:oneline --contract-name <contract name or fully qualified name> <constructor arguments> [--no-compile]`

When executed, this command will automatically determine whether the deployment is for a Transparent or UUps proxy. 
If the Transparent proxy is chosen, it will deploy implementation, admin, and proxy. 
If the UUps proxy is chosen, it will deploy implementation and proxy. Optionally, the no-compile parameter allows the task to skip the compilation process.

`yarn hardhat upgrade-beacon:oneline --contract-name <contract name or fully qualified name> --beacon-address <beacon address> [--no-compile]`

When executed, this command upgrade beacon implementation. Optionally, the `no-compile` parameter allows the task to skip the compilation process.

`yarn hardhat upgrade-proxy:oneline --contract-name <contract name or fully qualified name> --proxy-address <proxy address> [--no-compile]`

When executed, this command upgrade uups or transparent implementation. Optionally, the `no-compile` parameter allows the task to skip the compilation process.

Please consider that while the provided CLI commands enable contract deployment and upgrading, not all arguments may be available (e.g. initializer or kind propery). If these commands lack the required functionality, it may be necessary to utilize scripting for a more comprehensive approach.

## 📝 Documentation

In addition to the [hardhat-zksync](https://era.zksync.io/docs/tools/hardhat/plugins.html), zkSync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

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