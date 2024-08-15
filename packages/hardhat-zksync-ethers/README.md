# hardhat-zksync-ethers 🚀

ZKsync Era [Hardhat](https://hardhat.org/) plugin that is a wrapper around [zksync-ethers](https://www.npmjs.com/package/zksync-ethers) sdk that gives additional methods to use for faster development.

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

In addition to the [hardhat-zksync-ethers](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-ethers), ZKsync's Era [website](https://docs.zksync.io/build) offers a variety of resources including:

[Guides to get started](https://docs.zksync.io/build/start-coding/zksync-101): Learn how to start building on ZKsync Era.\
[Hardhat ZKsync Era plugins](https://docs.zksync.io/build/tooling/hardhat/getting-started): Overview and guides for all Hardhat ZKsync Era plugins.\
[ZK Chains](https://docs.zksync.io/zk-stack/concepts/zk-chains#what-are-zk-chains): Deep dive into the concept of ZK chains.

## 🤝 Contributing

Contributions are always welcome! Feel free to open any issue or send a pull request.

Go to [CONTRIBUTING.md](https://github.com/matter-labs/hardhat-zksync/blob/main/.github/CONTRIBUTING.md) to learn about steps and best practices for contributing to ZKsync hardhat tooling base repository.  


## 🙌 Feedback, help and news

[ZKsync Era Discord server](https://join.zksync.dev/): for questions and feedback.\
[Follow ZKsync Era on Twitter](https://twitter.com/zksync)

## Happy building! 👷‍♀️👷‍♂️