# ZKsync Era: Welcome to ZKsync Hardhat plugins repository

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

ZKsync Era is a layer 2 rollup that uses zero-knowledge proofs to scale Ethereum without compromising on security or
decentralization. Since it's EVM compatible (Solidity/Vyper), 99% of Ethereum projects can redeploy without refactoring
or re-auditing a single line of code. ZKsync Era also uses an LLVM-based compiler that will eventually let developers
write smart contracts in C++, Rust and other popular languages.

This repository contains a collection of plugins to aid in the development and deployment of smart contracts on the ZKsync network. These plugins are designed to integrate seamlessly with the [Hardhat](https://hardhat.org/) development environment, providing developers with an easy-to-use and powerful toolset.

Here is an overview of the plugins currently available:

| 🔌 Plugin                     | 📄 Description                                                                                                                    |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| hardhat-zksync-solc           | Simplifies compiling Solidity contracts for the ZKsync network, streamlining deployment preparation.                              |
| hardhat-zksync-deploy         | Facilitates the deployment of contracts on ZKsync, utilizing artifacts from hardhat-zksync-solc/vyper.                            |
| hardhat-zksync-verify         | Automates the process of verifying smart contracts on the ZKsync network, enhancing transparency and trust.                       |
| hardhat-zksync-verify-vyper   | Specialized for automating the verification of Vyper contracts on the ZKsync network.                                             |
| hardhat-zksync-vyper          | Streamlines the compilation of Vyper contracts for deployment on the ZKsync network.                                              |
| hardhat-zksync        | Offers a suite of ZKsync-related Hardhat plugins in one package, enhancing accessibility and efficiency.                          |
| hardhat-zksync-upgradeable    | Enables easier deployment and upgrading of smart contracts on the ZKsync network, improving contract lifecycle management.        |
| hardhat-zksync-node           | Convenient plugin to run the ZKsync era-test-node locally.                                                                        |
| hardhat-zksync-ethers         | A zksync-ethers SDK wrapper providing additional methods for accelerated development on ZKsync.                                   |

You can find more detailed explanations on how to use hardhat ZKsync plugins on our [documentation page](https://docs.zksync.io/build/tooling/hardhat/getting-started) where each plugin has its own section:

[hardhat-zksync](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync)\
[hardhat-zksync-solc](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-solc)\
[hardhat-zksync-deploy](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-deploy)\
[hardhat-zksync-verify](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-verify)\
[hardhat-zksync-verify-vyper](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-verify-vyper)\
[hardhat-zksync-vyper](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-vyper)\
[hardhat-zksync-upgradable](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-upgradable)\
[hardhat-zksync-node](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-node)\
[hardhat-zksync-ethers](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-ethers)


We hope you find these plugins useful in your development efforts.\
Happy coding!🙌🎉
## License

hardhat-zksync is distributed under the terms of both the MIT license and the Apache License (Version 2.0).

See [LICENSE-APACHE](LICENSE-APACHE), [LICENSE-MIT](LICENSE-MIT) for details.

## Official Links

- [Website](https://zksync.io/)
- [GitHub](https://github.com/matter-labs)
- [Twitter](https://twitter.com/zksync)
- [Twitter for Devs](https://twitter.com/zkSyncDevs)
- [Discord](https://join.zksync.dev)
