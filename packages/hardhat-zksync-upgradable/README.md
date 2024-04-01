# hardhat-zksync-upgradable

zkSync Era's [Hardhat](https://hardhat.org/) plugin to deploy and upgrade smart contracts easily.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

## ⚠️ Version Compatibility Warning

Ensure you are using the correct version of the plugin with ethers:
- For plugin version **<1.0.0**:
  - Compatible with ethers **v5**.

- For plugin version **≥1.0.0**:
  - Compatible with ethers **v6** (⭐ Recommended)

## 📥 Installation

To install **hardhat-zksync-upgradable** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-upgradable`

or

`yarn add -D @matterlabs/hardhat-zksync-upgradable @openzeppelin/contracts @openzeppelin/contracts-upgradeable`

## 📖 Example

The plugin supports three types of proxies: Transparent upgradable proxies, UUPS proxies, and beacon proxies.

Upgradability methods are all part of the zkUpgrades property in the HardhatRuntimeEnvironment and you only need to interact with it in order to deploy or upgrade your contracts.

- **Deploying proxies**

To deploy a simple upgradable contract on zkSync Era local setup, first create a test wallet and add it to the new Deployer.
After that, load the your contract artifact and call the deployProxy method from the zkUpgrades hre property.


```
const zkWallet = new Wallet("PRIVATE_KEY");
const deployer = new Deployer(hre, zkWallet);
const contract = await deployer.loadArtifact("YourContractName");
await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [initializerFunctionArguments], { initializer: "initialize" });
```

The deployProxy method deploys your implementation contract on zkSync Era, deploys the proxy admin contract, and finally, deploys the transparent proxy.

- **Deploying UUPS proxies**

The UUPS proxy pattern is similar to the transparent proxy pattern, except that the upgrade is triggered via the logic contract instead of from the proxy contract.
To deploy the UUPS contract, use the same script as for the transparent upgradable proxy.
When you run the script, the plugin detects that the proxy type is UUPS, it executes the deployment, and saves the deployment info in your manifest file.

- **Beacon proxies**

Beacon proxies enable a more advanced upgrade pattern, where multiple implementation contracts can be deployed and "hot-swapped" on the fly with no disruption to the contract's operation.

Start by creating a Deployer for the zkSync Era network and load the Box artifact:

- **Upgrading proxies**

In order for a smart contract implementation to be upgradable, it has to follow specific [rules](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable).

To upgrade the implementation of the transparent upgradeable contract, use the upgradeProxy method from the zkUpgrades.

```
const myContractV2 = await deployer.loadArtifact('contractV2');
await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, <PROXY_ADDRESS>, myContractV2);
```

- **Upgrade UUPS proxy**

Similar to the deployment script, there are no modifications needed to upgrade the implementation of the UUPS contract, compared to upgrading the transparent upgradable contract.

- **Upgrade beacon proxy**

Beacon proxy implementation can be upgraded using a similarly structured method from the zkUpgrades called upgradeBeacon

```
const myContractV2 = await deployer.loadArtifact('contractV2');
await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, <BEACON_PROXY_ADDRESS>, myContractV2);
```

The hardhat-zksync-upgradable plugin supports proxy verification, which means you can verify all the contracts deployed during the proxy deployment with a single verify command.
Check how to verify on this [link](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-upgradable.html#proxy-verification)

## 💼 Proxy validations

The hardhat-zksync-upgradable plugin has built-in checks to ensure that your smart contract's newest implementation version follows the necessary requirements when upgrading your smart contract.

You can learn more about what those restrictions are in [OpenZeppelin's documentation](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable).

## 🧯 Proxy gas fee estimation

Should you wish to estimate the total gas used throughout the proxy deployment process, consider utilizing the upgradable plugin's gas estimation functions. We offer three types of gas estimation functions for your convenience:

- estimateGasProxy
- estimateGasBeacon
- estimateGasBeaconProxy

To estimate the deployment fee for the Transparent upgradable proxies and UUPS proxies, use the estimateGasProxy method from the zkUpgrades.estimation.
This method calculates the fee for deploying the implementation contract, transparent proxy/UUPS contract, and the ProxyAdmin smart contract.

`const totalGasEstimation = await hre.zkUpgrades.estimation.estimateGasProxy(deployer, contract, [], { kind: "transparent" });`

To estimate the deployment fee for the beacon contract and its corresponding implementation, use the estimateGasBeacon method:

`const totalGasEstimation = await hre.zkUpgrades.estimation.estimateGasBeacon(deployer, contract, []);`

If you want to get the estimation for the beacon proxy contract, please use the estimateGasBeaconProxy method:

`const totalGasEstimation = await hre.zkUpgrades.estimation.estimateGasBeacon(deployer, contract, []);`

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

`yarn hardhat deploy-beacon:oneline --contract-name <contract name or fully qualified name> <constructor arguments> [--initializer <initialize method>] [--no-compile]`

When executed, this command deploys the provided implementation, beacon and proxy on the specified network, using the provided contract constructor arguments.
The initializer method name can optionally be specified using `--initializer <initializer method name>`, with the default method name being set to `initialize`. 
Optionally, the `--no-compile` parameter allows the task to skip the compilation process.

`yarn hardhat deploy-proxy:oneline --contract-name <contract name or fully qualified name> <constructor arguments> [--initializer <initialize method>] [--no-compile]`

When executed, this command will automatically determine whether the deployment is for a Transparent or Uups proxy. 
If the Transparent proxy is chosen, it will deploy implementation, admin, and proxy. 
If the Uups proxy is chosen, it will deploy implementation and proxy.
The initializer method name can optionally be specified using `--initializer <initializer method name>`, with the default method name being set to `initialize`.
The `--no-compile` parameter allows the task to skip the compilation process.

`yarn hardhat upgrade-beacon:oneline --contract-name <contract name or fully qualified name> --beacon-address <beacon address> [--no-compile]`

When executed, this command upgrade beacon implementation. 
Optionally, the `--no-compile` parameter allows the task to skip the compilation process.

`yarn hardhat upgrade-proxy:oneline --contract-name <contract name or fully qualified name> --proxy-address <proxy address> [--no-compile]`

When executed, this command upgrade Uups or Transparent implementation. 
Optionally, the `--no-compile` parameter allows the task to skip the compilation process.

Please consider that while the provided CLI commands enable contract deployment and upgrading, not all arguments may be available. If these commands lack the required functionality, it may be necessary to utilize scripting for a more comprehensive approach.

## 📝 Documentation

In addition to the [hardhat-zksync-upgradable](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-upgradable.html), zkSync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

[Guides to get started](https://era.zksync.io/docs/dev/building-on-zksync/hello-world.html): Learn how to start building on zkSync Era.\
[Hardhat zkSync Era plugins](https://era.zksync.io/docs/tools/hardhat/getting-started.html): Overview and guides for all Hardhat zkSync Era plugins.\
[Hyperscaling](https://era.zksync.io/docs/reference/concepts/hyperscaling.html#what-are-hyperchains): Deep dive into hyperscaling on zkSync Era.

## 🤝 Contributing

Contributions are always welcome! Feel free to open any issue or send a pull request.

Go to [CONTRIBUTING.md](https://github.com/matter-labs/hardhat-zksync/blob/main/.github/CONTRIBUTING.md) to learn about steps and best practices for contributing to zkSync hardhat tooling base repository.  


## 🙌 Feedback, help and news

[zkSync Era Discord server](https://join.zksync.dev/): for questions and feedback.\
[Follow zkSync Era on Twitter](https://twitter.com/zksync)

## Happy building!