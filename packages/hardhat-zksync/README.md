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

## 🕹 Shortcuts commands

### 📥 Configuration
To extend the configuration to support commands, we need to add an accounts field to the specific network configuration in the networks section of the hardhat.config.ts file. This accounts field can support an array of private keys or a mnemonic object and represents accounts that will be used as wallet automaticlly.

```
const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/<API_KEY>" // The Ethereum Web3 RPC URL (optional).
    },
    zkTestnet: {
      url: "https://sepolia.era.zksync.dev", // The testnet RPC URL of zkSync Era network.
      ethNetwork: "sepolia", // The Ethereum Web3 RPC URL, or the identifier of the network (e.g. `mainnet` or `sepolia`)
      zksync: true,
      // ADDITON
      accounts: ['0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3', '0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959'], // The private keys for the accounts used in the deployment or in the upgradation process.
      accounts: {
          mnemonic: 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle'
      }
      // Mnemonic used in the deployment or in the upgradation process
    }
  },
};
```
- accounts represents a list of the private keys or mnemonic object for the account used in the deployment or in the upgradation process.

accounts object will be automaticly be populated with rich accounts if used network is zkSync Era Test Node or zksync-cli Local Node

### 🕹 Commands

#### Contract deployment shortcuts 

`yarn hardhat deploy-zksync:oneline --contract-name <contract name or fully qualified name> <constructor arguments> [--verify] [--no-compile]`

When executed, this command deploys the provided contract on the specified network, using the provided contract constructor arguments. 
Using the `verify` parameter verifies the contract after deployment, while `no-compile` skips the compilation process.

#### Contract upgrades shortcuts 

`yarn hardhat deploy-beacon:oneline --contract-name <contract name or fully qualified name> <constructor arguments> [--verify] [--no-compile]`

When executed, this command deploys the provided implementation, beacon and proxy on the specified network, using the provided contract constructor arguments. 
Optionally, the `--no-compile` parameter allows the task to skip the compilation process.

`yarn hardhat deploy-proxy:oneline --contract-name <contract name or fully qualified name> <constructor arguments> [--initializer <initializer method>] [--verify] [--no-compile]`

When executed, this command will automatically determine whether the deployment is for a Transparent or UUps proxy. 
If the Transparent proxy is chosen, it will deploy implementation, admin, and proxy. 
If the Uups proxy is chosen, it will deploy implementation and proxy.
The initializer method name can optionally be specified using `--initializer <initializer method name>`, with the default method name being set to initialize.
The `--no-compile` parameter allows the task to skip the compilation process.
The `--verify` parameter allow the task to verify all deployed contracts.

`yarn hardhat upgrade-beacon:oneline --contract-name <contract name or fully qualified name> --beacon-address <beacon address> [--verify] [--no-compile]`

When executed, this command upgrade beacon implementation. 
Optionally, the `--no-compile` parameter allows the task to skip the compilation process.
The `--verify` parameter allow the task to verify all deployed contracts.

`yarn hardhat upgrade-proxy:oneline --contract-name <contract name or fully qualified name> --proxy-address <proxy address>  [--verify] [--no-compile]`

When executed, this command upgrade uups or transparent implementation. 
Optionally, the `no-compile` parameter allows the task to skip the compilation process.
The `--verify` parameter allow the task to verify all deployed contracts.

Please consider that while the provided CLI commands enable contract deployment and upgrading, not all arguments may be available. If these commands lack the required functionality, it may be necessary to utilize scripting for a more comprehensive approach.

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