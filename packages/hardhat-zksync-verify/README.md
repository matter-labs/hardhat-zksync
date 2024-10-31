# hardhat-zksync-verify 🚀

ZKsync Era [Hardhat](https://hardhat.org/) plugin to verify contracts on the ZKsync network.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

## ⚠️ Version Compatibility Warning

Ensure you are using the correct version of the plugin with ethers:
- For plugin version **<1.0.0**:
  - Compatible with ethers **v5**.

- For plugin version **≥1.0.0**:
  - Compatible with ethers **v6** (⭐ Recommended)

From version **1.6.0**, the plugin is not dependent on a specific ethers version and can be used for both ethers **v5** and **v6** projects.

## 📥 Installation

To install **hardhat-zksync-verify** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-verify`

or

`yarn add -D @matterlabs/hardhat-zksync-verify @nomicfoundation/hardhat-verify`

## 🔩	Configuration

Import the plugin in the hardhat.config.ts file:

`import "@matterlabs/hardhat-zksync-verify";`

```
networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/<API_KEY>" // The Ethereum Web3 RPC URL (optional).
    },
    zkTestnet: {
      url: "https://sepolia.era.zksync.dev", // The testnet RPC URL of ZKsync Era network.
      ethNetwork: "sepolia", // The Ethereum Web3 RPC URL, or the identifier of the network (e.g. `mainnet` or `sepolia`)
      zksync: true,
    }
},

```
### Updates introduced in plugin version 1.7.0.

Etherscan verification is supported. To enable it, configure the etherscan property in the Hardhat configuration: 

```
etherscan: {
  apiKey: 'APIKEY'
}
```
If the etherscan property is configured and enabled, verification will run on Etherscan. Otherwise, the plugin will default to verifying on the ZKsync block explorer.

For more information on how to create api keys, please [visit the documentation](https://docs.zksync.network/getting-started/viewing-api-usage-statistics).
For more information on how to configre etherscan for multiple api keys, please [visit the documentation](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify#multiple-api-keys-and-alternative-block-explorers)

| 🔧 properties              | 📄 Description                                                                                                                       |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| zkTestnet                  | Arbitrary ZKsync Era network name. You can select this as the default network using the defaultNetwork property.                     |
| url                        | Field is required for all ZKsync Era and Ethereum networks used by this plugin. For ZKsync network, set it to true                   |
| ethNetwork                 | Field with the URL of the Ethereum node.                                                                                             |
| ethers                     | Provider for the network if the configuration is not provided. This field is required for all ZKsync networks used by this plugin.   |
| zksync                     | Flag that indicates a ZKsync Era network configuration. This field is set to true for all ZKsync Era networks.                       |
| verifyURL                  | This field specifies the verification endpoint for the connected ZKsync network. From version 1.7.0, the plugin automatically resolves this endpoint based on the network configuration. If you are using a custom chain with an API compatible with the zksync block explorer, you can manually set the URL here.                     |
| browserVerifyURL                  | Introduced in version 1.7.0 of the plugin, this field automatically resolves the browser URL based on the network configuration. If you're using a custom chain, you can manually specify the URL here.                     |
| enableVerifyURL                  | Introduced in version 1.7.0 of the plugin, this flag forces verification on the ZKsync block explorer. It allows you to verify the same contract on both Etherscan and the ZKsync block explorer.                     |

Default values for verifyURL are:

- Testnet: https://explorer.sepolia.era.zksync.dev/contract_verification
- Mainnet: https://zksync2-mainnet-explorer.zksync.io/contract_verification

## 🕹 Commands

`yarn hardhat verify --network <network> <contract address>`

This command verifies the contract on the given network with the given contract's address.
When executed in this manner, the verification task attempts to compare the compiled bytecode of all the contracts in your local environment with the deployed bytecode of the contract you are seeking to verify. If there is no match, it reports an error.

`yarn hardhat verify --network <network> <contract address> --contract <fully qualified name>`

With the --contract parameter you can also specify which contract from your local setup you want to verify by specifying its Fully qualified name. Fully qualified name structure looks like this: "contracts/AContract.sol:TheContract"

**Constructor arguments**

If your contract was deployed with the specific constructor arguments, you need to specify them when running the verify task. For example:

`yarn hardhat verify --network testnet 0x7cf08341524AAF292255F3ecD435f8EE1a910AbF "Hi there!"`

**Verification status check**

The verification process consists of two steps:

- A verification request is sent to confirm if the given parameters for your contract are correct.

- Then, we check the verification status of that request. Both steps run when you run the verify task, but you will be able to see your specific verification request ID. You can then use this ID to check the status of your verification request without running the whole process from the beginning.

**Verify smart contract programmatically**

If you need to run the verification task directly from your code, you can use the hardhat verify:verify task with the previously mentioned parameters with the difference in using --address parameter when specifying contract's address.

Example:

```
const verificationId = await hre.run("verify:verify", {
  address: contractAddress,
  contract: contractFullyQualifedName,
  constructorArguments: [...]
});
```
## 📝 Documentation

In addition to the [hardhat-zksync-verify](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-verify), ZKsync's Era [website](https://docs.zksync.io/build) offers a variety of resources including:

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