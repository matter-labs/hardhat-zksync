# hardhat-zksync-ethers 🚀

zkSync Era [Hardhat](https://hardhat.org/) plugin that is a wrapper around [zksync-ethers](https://www.npmjs.com/package/zksync-ethers) sdk that gives additional methods to use for faster development.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

## 📥 Installation

To install **hardhat-zksync-ethers** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-ethers`

or

`yarn add -D @matterlabs/hardhat-zksync-ethers zksync-ethers ethers`

## Helpers

| 🙏 Helper                                     | 📄 Description                                                                                                |
|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| providerL2                                      | Retruns a Provider for L2 automatically connected to the selected network.                                           |
| providerL1                                      | Retruns a Provider for L1 automatically connected to the selected network.                                           |
| getWallet                                     | Returns Wallet for the given private key or index.                                                            |
| getContractFactory variant1                   | Returns a ContractFactory for provided artifact name.                                                         |
| getContractFactory variant2                   | Returns a ContractFactory for provided artifact abi and bytecode.                                             |
| getContractFactoryFromArtifact                | Returns a ContractFactory for provided artifact.                                                              |
| getContractAt                                 | Returns Contract for provided artifact name or abi and address of deployed contract.                          |
| getContractAtFromArtifact                     | Returns ContractFactory for provided artifact and address of deployed contract                                |
| getImpersonatedSigner                         | Impersonates Signer from address                                                                              |
| extractFactoryDeps                            | Extracts factory deps from artifact                                                                           |
| loadArtifact                                  | Load ZkSyncArtifact from contract name                                                                        |
| deployContract                                | Deploys a contract to the network                                                                             |

## 📖 Example

After installing it, add the plugin to your Hardhat config:

`import "@matterlabs/hardhat-zksync-ethers";`

This plugin extends hardhat runtime environment, use it like this:

Retrieve your contract factory:

`const myContractFactory = await hre.zksyncEthers.getContractFactory("MyContract");`

Deploy your contract: 

`const myContract = await myContractFactory.deploy("Hello, world!");`

Find deployed address:

`console.info(await myContract.getAddress());`

## 📝 Documentation

In addition to the [hardhat-zksync-ethers](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-ethers.html), zkSync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

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