# zkSync Era: Welcome to zkSync Hardhat plugins repository

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

zkSync Era is a layer 2 rollup that uses zero-knowledge proofs to scale Ethereum without compromising on security or
decentralization. Since it's EVM compatible (Solidity/Vyper), 99% of Ethereum projects can redeploy without refactoring
or re-auditing a single line of code. zkSync Era also uses an LLVM-based compiler that will eventually let developers
write smart contracts in C++, Rust and other popular languages.

This repository contains a collection of plugins to aid in the development and deployment of smart contracts on the zkSync network. These plugins are designed to integrate seamlessly with the [Hardhat](https://hardhat.org/) development environment, providing developers with an easy-to-use and powerful toolset.

Here is an overview of the plugins currently available:

| 🔌 Plugin                     | 📄 Description                                                                                                                    |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| hardhat-zksync-solc           | Simplifies compiling Solidity contracts for the zkSync network, streamlining deployment preparation.                              |
| hardhat-zksync-deploy         | Facilitates the deployment of contracts on zkSync, utilizing artifacts from hardhat-zksync-solc/vyper.                            |
| hardhat-zksync-verify         | Automates the process of verifying smart contracts on the zkSync network, enhancing transparency and trust.                       |
| hardhat-zksync-verify-vyper   | Specialized for automating the verification of Vyper contracts on the zkSync network.                                             |
| hardhat-zksync-vyper          | Streamlines the compilation of Vyper contracts for deployment on the zkSync network.                                              |
| hardhat-zksync        | Offers a suite of zkSync-related Hardhat plugins in one package, enhancing accessibility and efficiency.                          |
| hardhat-zksync-upgradeable    | Enables easier deployment and upgrading of smart contracts on the zkSync network, improving contract lifecycle management.        |
| hardhat-zksync-node           | Convenient plugin to run the zkSync era-test-node locally.                                                                        |
| hardhat-zksync-ethers         | A zksync-ethers SDK wrapper providing additional methods for accelerated development on zkSync.                                   |

You can find more detailed explanations on how to use hardhat zkSync plugins on our [documentation page](https://v2-docs.zksync.io/api/hardhat/plugins.html#plugins) where each plugin has its own section:

[hardhat-zksync-solc](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-solc.html)\
[hardhat-zksync-deploy](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-deploy.html)\
[hardhat-zksync-verify](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-verify.html)\
[hardhat-zksync-verify-vyper](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-verify-vyper.html)\
[hardhat-zksync-vyper](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-vyper.html)\
[hardhat-zksync](https://era.zksync.io/docs/tools/hardhat/plugins.html)\
[hardhat-zksync-upgradeable](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-upgradable.html)\
[hardhat-zksync-node](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-node.html)\
[hardhat-zksync-ethers](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-ethers.html)


We hope you find these plugins useful in your development efforts.\
Happy coding!🙌🎉

## License

hardhat-zkSync is distributed under the terms of both the MIT license and the Apache License (Version 2.0).

See [LICENSE-APACHE](LICENSE-APACHE), [LICENSE-MIT](LICENSE-MIT) for details.

## Official Links

- [Website](https://zksync.io/)
- [GitHub](https://github.com/matter-labs)
- [Twitter](https://twitter.com/zksync)
- [Twitter for Devs](https://twitter.com/zkSyncDevs)
- [Discord](https://join.zksync.dev)
