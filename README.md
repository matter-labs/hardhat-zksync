# zkSync 2.0: Welcome to zkSync Hardhat plugins repository

![](https://user-images.githubusercontent.com/8230135/215079996-46ec1c91-e65d-4adb-8d7a-f7eecf851858.svg)

zkSync 2.0 is a layer 2 rollup that uses zero-knowledge proofs to scale Ethereum without compromising on security or
decentralization. Since it's EVM compatible (Solidity/Vyper), 99% of Ethereum projects can redeploy without refactoring
or re-auditing a single line of code. zkSync 2.0 also uses an LLVM-based compiler that will eventually let developers
write smart contracts in C++, Rust and other popular languages.

This repository contains a collection of plugins to aid in the development and deployment of smart contracts on the zkSync network. These plugins are designed to integrate seamlessly with the [Hardhat](https://hardhat.org/) development environment, providing developers with an easy-to-use and powerful toolset.

Here is an overview of the plugins currently available:

**hardhat-zksync-solc**: This plugin is used to provide a convenient interface for compiling Solidity smart contracts before deploying them to the zkSync network.

**hardhat-zksync-deploy**: This plugin simplifies the deployment of your smart contracts to the zkSync network by providing utilities for deploying smart contracts with artifacts built by the zkSync hardhat-zksync-solc or hardhat-zksync-vyper plugins.

**hardhat-zksync-verify**: This plugin helps you to verify your smart contracts on the zkSync network by providing a set of tasks that automate the verification process.

**hardhat-zksync-vyper**: This plugin is used to provide a convenient interface for compiling Vyper smart contracts before deploying them to the zkSync network.

**hardhat-zksync-chai-matchers**: This plugin adds additional chai matchers to be used when writing tests with specific zkSync features.

You can find more detailed explanations on how to use hardhat zkSync plugins on our [documentation page](https://v2-docs.zksync.io/api/hardhat/plugins.html#plugins) where each plugin has its own section:

[hardhat-zksync-solc](https://v2-docs.zksync.io/api/hardhat/plugins.html#hardhat-zksync-solc)\
[hardhat-zksync-deploy](https://v2-docs.zksync.io/api/hardhat/plugins.html#hardhat-zksync-deploy)\
[hardhat-zksync-verify](https://v2-docs.zksync.io/api/hardhat/plugins.html#hardhat-zksync-verify)\
[hardhat-zksync-vyper](https://v2-docs.zksync.io/api/hardhat/plugins.html#hardhat-zksync-vyper)\
[hardhat-zksync-chai-matchers](https://v2-docs.zksync.io/api/hardhat/plugins.html#hardhat-zksync-chai-matchers)

We hope you find these plugins useful in your development efforts.\
Happy coding!🙌🎉\o/

## License

hardhat-zkSync is distributed under the terms of both the MIT license and the Apache License (Version 2.0).

See [LICENSE-APACHE](LICENSE-APACHE), [LICENSE-MIT](LICENSE-MIT) for details.

## Official Links

- [Website](https://zksync.io/)
- [GitHub](https://github.com/matter-labs)
- [Twitter](https://twitter.com/zksync)
- [Twitter for Devs](https://twitter.com/zkSyncDevs)
- [Discord](https://discord.gg/nMaPGrDDwk)
