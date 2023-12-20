# zkSync 2.0: Welcome to zkSync Hardhat plugins repository

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

zkSync 2.0 is a layer 2 rollup that uses zero-knowledge proofs to scale Ethereum without compromising on security or
decentralization. Since it's EVM compatible (Solidity/Vyper), 99% of Ethereum projects can redeploy without refactoring
or re-auditing a single line of code. zkSync 2.0 also uses an LLVM-based compiler that will eventually let developers
write smart contracts in C++, Rust and other popular languages.

This repository contains a collection of plugins to aid in the development and deployment of smart contracts on the zkSync network. These plugins are designed to integrate seamlessly with the [Hardhat](https://hardhat.org/) development environment, providing developers with an easy-to-use and powerful toolset.

Here is an overview of the plugins currently available:

| 🔌 Plugin                     | 📄 Description                                                                                                                    |
|----------------------- -------|-----------------------------------------------------------------------------------------------------------------------------------|
| hardhat-zksync-solc           | Plugin simplifies the compilation of Solidity smart contracts for deployment on the zkSync network.  |
| hardhat-zksync-deploy         | Plugin eases zkSync contract deployment using hardhat-zksync-solc/vyper artifacts. |
| hardhat-zksync-verify         | Plugin automates smart contract verification on zkSync network. |
| hardhat-zksync-verify-vyper   | Plugin automates verification of Vyper contracts on zkSync network. |
| hardhat-zksync-vyper          | Plugin facilitates compiling Vyper contracts for zkSync network deployment. |
| hardhat-zksync-chai-matchers  | Plugin adds additional chai matchers to be used when writing tests with specific zkSync features. |
| hardhat-zksync-toolbox        | Plugin provides a convenient method for bundling and accessing a range of zkSync-related Hardhat plugins. |
| hardhat-zksync-upgradeable    | Plugin provides a convenient method to deploy and upgrade smart contracts on the zkSync network. |
| hardhat-zksync-ethers         | Plugin is a wrapper around zksync-ethers sdk that gives additional methods to use for faster development. |

You can find more detailed explanations on how to use hardhat zkSync plugins on our [documentation page](https://v2-docs.zksync.io/api/hardhat/plugins.html#plugins) where each plugin has its own section:

[hardhat-zksync-solc](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-solc.html)\
[hardhat-zksync-deploy](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-deploy.html)\
[hardhat-zksync-verify](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-verify.html)\
[hardhat-zksync-verify-vyper](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-verify-vyper.html)\
[hardhat-zksync-vyper](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-vyper.html)\
[hardhat-zksync-chai-matchers](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-chai-matchers.html)\
[hardhat-zksync-toolbox](https://era.zksync.io/docs/tools/hardhat/plugins.html)\
[hardhat-zksync-upgradeable](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-upgradable.html)\
[hardhat-zksync-ethers](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-ethers.html)


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
- [Discord](https://join.zksync.dev)
