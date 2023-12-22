# hardhat-zksync-verify-vyper 🚀

[Hardhat](https://hardhat.org/) plugin that adds zkSync-specific capabilities to verify vyper smart contracts.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

## 📥 Installation

To install **hardhat-zksync-verify-vyper** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-verify-vyper`

or

`yarn add -D @matterlabs/hardhat-zksync-verify-vyper`

## 🔩 Configuration

Import the plugin in the hardhat.config.ts file:

`import "@matterlabs/hardhat-zksync-verify-vyper";`

Add the verifyURL property to the zkSync Era network in the hardhat.config.ts file as shown below:

```
networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/<API_KEY>" // The Ethereum Web3 RPC URL (optional).
    },
    zkTestnet: {
      url: "https://sepolia.era.zksync.dev", // The testnet RPC URL of zkSync Era network.
      ethNetwork: "sepolia", // The Ethereum Web3 RPC URL, or the identifier of the network (e.g. `mainnet` or `sepolia`)
      zksync: true,
      // Verification endpoint for Sepolia
      verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification'
    }
},
// defaultNetwork: "zkTestnet", // optional (if not set, use '--network zkTestnet')
```

| 🔧 properties              | 📄 Description                                                                                                                       |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| zkTestnet                  | Arbitrary zkSync Era network name. You can select this as the default network using the defaultNetwork property.                     |
| url                        | Field is required for all zkSync Era and Ethereum networks used by this plugin. For zkSync network, set it to true                   |
| ethNetwork                 | Field with the URL of the Ethereum node.                                                                                             |
| ethers                     | Provider for the network if the configuration is not provided. This field is required for all zkSync networks used by this plugin.   |
| zksync                     | Flag that indicates a zkSync Era network configuration. This field is set to true for all zkSync Era networks.                       |
| verifyURL                  | Field that points to the verification endpoint for the specific zkSync network. This parameter is optional.                          |

Default values for verifyURL are:

- Testnet: https://explorer.sepolia.era.zksync.dev/contract_verification
- Mainnet: https://zksync2-mainnet-explorer.zksync.io/contract_verification

## 🕹 Commands

`yarn hardhat verify:vyper --network <network> <contract address>`

This command verifies the contract on the given network with the given contract's address.
When executed in this manner, the verification task attempts to compare the compiled bytecode of all the contracts in your local environment with the deployed bytecode of the contract you are seeking to verify. If there is no match, it reports an error.

`yarn hardhat verify:vyper --network <network> <contract address> --contract <fully qualified name>`

With the --contract parameter you can also specify which contract from your local setup you want to verify by specifying its Fully qualified name. Fully qualified name structure looks like this: "contracts/Contract.vy:Contract"

The following command checks the status of the verification request for the specific verification ID:

`yarn hardhat verify-status:vyper --verification-id <your verification id>`


**Constructor arguments**

If your contract was deployed with specific constructor arguments, you need to specify them when running the verify task. For example:

`yarn hardhat verify:vyper --network testnet 0x7cf08341524AAF292255F3ecD435f8EE1a910AbF "Hi there!"`

**Verification status check**

The verification process consists of two steps:

- A verification request is sent to confirm if the given parameters for your contract are correct.

- Then, we check the verification status of that request. Both steps run when you run the verify:vyper task, but you will be able to see your specific verification request ID. You can then use this ID to check the status of your verification request without running the whole process from the beginning.

**Verify smart contract programmatically**

If you need to run the verification task directly from your code, you can use the hardhat verify:verify:vyper task with the previously mentioned parameters.

Example:

```
const verificationId = await hre.run("verify:verify:vyper", {
  address: contractAddress,
  contract: contractFullyQualifedName,
  constructorArguments: [...]
});
```
## 📝 Documentation

In addition to the [hardhat-zksync-verify-vyper](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-verify-vyper.html), zkSync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

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