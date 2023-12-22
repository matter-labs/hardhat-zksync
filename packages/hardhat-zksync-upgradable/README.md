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