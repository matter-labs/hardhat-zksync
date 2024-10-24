# hardhat-zksync-upgradable

ZKsync Era's [Hardhat](https://hardhat.org/) plugin to deploy and upgrade smart contracts easily.

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

To deploy a simple upgradable contract on ZKsync Era local setup, first create a test wallet and add it to the new Deployer.
After that, load the your contract artifact and call the deployProxy method from the zkUpgrades hre property.


```
const zkWallet = new Wallet("PRIVATE_KEY");
const deployer = new Deployer(hre, zkWallet);
const contract = await deployer.loadArtifact("YourContractName");
await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [initializerFunctionArguments], { initializer: "initialize" });
```

The deployProxy method deploys your implementation contract on ZKsync Era, deploys the proxy admin contract, and finally, deploys the transparent proxy.

Additionaly, in the options section optionaly include the folowing arguments to configure the deployment of the proxy and implementation with different deployment types and salts:

 - `deploymentTypeImpl`
 - `saltImpl`
 - `deploymentTypeProxy`
 - `saltProxy`

```
await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [initializerFunctionArguments], 
  { initializer: "initialize",
    saltImpl: "0x4273795673417857416686492163276941983664248508133571812215241323",
    deploymentTypeImpl: "create2",
    saltProxy: "0x5273795673417857416686492163276941983664248508133571812215241323",
    deploymentTypeProxy: "create2"
  }
);
```

Permissible values for the deployment type include `create`, `create2`, `createAccount`, and `create2Account`. If this parameter is omitted, the default value will be `create`.
If the salt parameters are ommited, the default value will be `0x0000000000000000000000000000000000000000000000000000000000000000`.

In the options section, paymaster parameters can be included for both proxy and implementation deployments. To do so, use:
 - `paymasterProxyParams`
 - `paymasterImplParams`

 ```
await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [initializerFunctionArguments], 
  { initializer: "initialize",
    paymasterProxyParams: params,
    paymasterImplParams: params,
  }
);
```

- **Deploying UUPS proxies**

The UUPS proxy pattern is similar to the transparent proxy pattern, except that the upgrade is triggered via the logic contract instead of from the proxy contract.
To deploy the UUPS contract, use the same script as for the transparent upgradable proxy.
When you run the script, the plugin detects that the proxy type is UUPS, it executes the deployment, and saves the deployment info in your manifest file.

- **Beacon proxies**

Beacon proxies enable a more advanced upgrade pattern, where multiple implementation contracts can be deployed and "hot-swapped" on the fly with no disruption to the contract's operation.

Start by creating a Deployer for the ZKsync Era network and load the Box artifact:

```
// mnemonic for local node rich wallet
const testMnemonic = "stuff slice staff easily soup parent arm payment cotton trade scatter struggle";
const zkWallet = Wallet.fromMnemonic(testMnemonic);

const deployer = new Deployer(hre, zkWallet);

const contractName = "Box";
const boxContract = await deployer.loadArtifact(contractName);
```

Deploy the beacon contract using `deployBeacon` method from the `zkUpgrades`:

```
await hre.zkUpgrades.deployBeacon(deployer.zkWallet, boxContract);
```

Use the `deployBeaconProxy` method which receives the ZKsync Era wallet, beacon contract, and the implementation (Box) contract with its arguments.

```
const box = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, boxContract, [42]);

```

Additionaly, in the options section optionaly include the `deploymentType` and `salt` arguments to configure deployment type and salt.

```
await hre.zkUpgrades.deployBeacon(deployer.zkWallet, boxContract, {
  deploymentType: 'create2',
  salt: '0x5273795673417857416686492163276941983664248508133571812215241323'
});

const box = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, boxContract, [42], {
  deploymentType: 'create2',
  salt: '0x6273795673417857416686492163276941983664248508133571812215241323'
});

```

Permissible values for the deployment type include `create`, `create2`, `createAccount`, and `create2Account`. If this parameter is omitted, the default value will be `create`.
If the salt parameters are ommited, the default value will be `0x0000000000000000000000000000000000000000000000000000000000000000`.

In the options section, you can include paymaster parameters. To do so, use
`paymasterParams` argument.

```
await hre.zkUpgrades.deployBeacon(deployer.zkWallet, boxContract, {
  paymasterParams: params
});

const box = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, boxContract, [42], {
  paymasterParams: params
});

```
- **Upgrading proxies**

In order for a smart contract implementation to be upgradable, it has to follow specific [rules](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable).

To upgrade the implementation of the transparent upgradeable contract, use the upgradeProxy method from the zkUpgrades.

```
const myContractV2 = await deployer.loadArtifact('contractV2');
await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, <PROXY_ADDRESS>, myContractV2);
```

Optionaly in the other options section include `deploymentType` and `salt` to configure deployment type and salt for deploy of the new implementation.

 ```
const myContractV2 = await deployer.loadArtifact('contractV2');
await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, <PROXY_ADDRESS>, myContractV2, {
  deploymentType: 'create2',
  salt: '0x6273795673417857416686492163276941983664248508133571812215241323'
});
```

- **Upgrade UUPS proxy**

Similar to the deployment script, there are no modifications needed to upgrade the implementation of the UUPS contract, compared to upgrading the transparent upgradable contract.

- **Upgrade beacon proxy**

Beacon proxy implementation can be upgraded using a similarly structured method from the zkUpgrades called upgradeBeacon

```
const myContractV2 = await deployer.loadArtifact('contractV2');
await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, <BEACON_PROXY_ADDRESS>, myContractV2);
```

Optionaly in the other options section include `deploymentType` and `salt` to configure deployment type and salt for deploy of the new implementation.

 ```
const myContractV2 = await deployer.loadArtifact('contractV2');
await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, <BEACON_PROXY_ADDRESS>, myContractV2 {
  deploymentType: 'create2',
  salt: '0x6273795673417857416686492163276941983664248508133571812215241323'
});
```

The hardhat-zksync-upgradable plugin supports proxy verification, which means you can verify all the contracts deployed during the proxy deployment with a single verify command.
Check how to verify on this [link](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-upgradable#proxy-verification)

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

## 🕹 Commands

Please consider that while the provided commands enable contract deployment and upgrading, not all arguments may be available. If these commands lack the required functionality, it may be necessary to utilize scripting for a more comprehensive approach.

### 📥 Configuration
To extend the configuration to support commands, we need to add an accounts field to the specific network configuration in the networks section of the hardhat.config.ts file. This accounts field can support an array of private keys or a mnemonic object and represents accounts that will be used as wallet automaticlly.

```typescript
const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/<API_KEY>" // The Ethereum Web3 RPC URL (optional).
    },
    zkTestnet: {
      url: "https://sepolia.era.zksync.dev", // The testnet RPC URL of ZKsync Era network.
      ethNetwork: "sepolia", // The Ethereum Web3 RPC URL, or the identifier of the network (e.g. `mainnet` or `sepolia`)
      zksync: true,
      // ADDITON
      // The private keys for the accounts used in the deployment or in the upgradation process.
      accounts: ['0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3', '0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959'], 
      // Mnemonic used in the deployment or in the upgradation process
      // accounts: {
      //     mnemonic: 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle'
      // }
    }
  },
};
```
- accounts represents a list of the private keys or mnemonic object for the account used in the deployment or in the upgradation process.

accounts object will be automaticly be populated with rich accounts if used network is ZKsync Era Test Node or zksync-cli Local Node

To establish a default index per network, which is by default `0`, you can include a `deployerAccounts` section in your `hardhat.config.ts` file.

```typescript
const config: HardhatUserConfig = {
  // ADDITON
  deployerAccounts: {
    'zkTestnet': 1, // The default index of the account for the specified network.
    //default: 0 // The default value for not specified networks. Automatically set by plugin to the index 0.
  },
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/<API_KEY>" // The Ethereum Web3 RPC URL (optional).
    },
    zkTestnet: {
      url: "https://sepolia.era.zksync.dev", // The testnet RPC URL of ZKsync Era network.
      ethNetwork: "sepolia", // The Ethereum Web3 RPC URL, or the identifier of the network (e.g. `mainnet` or `sepolia`)
      zksync: true,
      // The private keys for the accounts used in the deployment process.
      accounts: ['0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3', '0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959'],  
      // Mnemonic used in the deployment process
      // accounts: {
      //     mnemonic: 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle'
      // }  
    }
  },
};
```
- `deployerAccounts` represents an object where the default index of the accounts is provided and automatically used in the upgradable commands described below. If the network name is not specified inside the object, the default index of the account will be `0`. We can change and deafult index for not specified networks if we override `default` name with index that we want.

### 🕹 Command list

`yarn hardhat deploy-zksync:proxy --contract-name <contract name or FQN> [<constructor arguments>] [--constructor-args <javascript module name>] [--initializer <initialize method>] [--no-compile] [--initial-owner <initial owner>] [--deployment-type-impl <deployment type>] [--salt-impl <salt>] [--deployment-type-proxy <deployment type>] [--salt-proxy <salt>]`

When executed, this command will automatically determine whether the deployment is for a Transparent or UUPS proxy. 
If the Transparent proxy is chosen, it will deploy implementation, admin, and proxy. 
If the UUPS proxy is chosen, it will deploy implementation and proxy.

`yarn hardhat upgrade-zksync:proxy --contract-name <contract name or FQN> --proxy-address <proxy address> [--deployment-type <deployment type>] [--salt <salt>] [--no-compile]`

When executed, this command upgrade UUPS or Transparent implementation.
To upgrade a implementation we need to specify proxy address, add `--proxy-address <proxy address>` argument, e.g. `yarn hardhat upgrade-zksync:proxy --contract-name BoxV2 --proxy-address 0x4bbeEB066eD09B7AEd07bF39EEe0460DFa261520`.

`yarn hardhat deploy-zksync:beacon --contract-name <contract name or FQN> [<constructor arguments>] [--constructor-args <javascript module name>] [--initializer <initialize method>] [--deployment-type-impl <deployment type>] [--salt-impl <salt>] [--deployment-type-proxy <deployment type>] [--salt-proxy <salt>] [--initial-owner <initial owner>] [--no-compile]`

When executed, this command deploys the provided implementation, beacon and proxy on the specified network, using the provided contract constructor arguments.

`yarn hardhat upgrade-zksync:beacon --contract-name <contract name or FQN> --beacon-address <beacon address> [--deployment-type <deployment type>] [--salt <salt>] [--no-compile]`

When executed, this command upgrade beacon implementation.
To upgrade a implementation we need to specify beacon address, add `--beacon-address <beacon address>` argument, e.g. `yarn hardhat upgrade-zksync:beacon --contract-name BoxV2 --beacon-address 0x4bbeEB066eD09B7AEd07bF39EEe0460DFa261520`.

- To provide a contract name or FQN, required argument in all tasks, add a `--contract-name <contract name or FQN>` argument, e.g. `hardhat deploy-zksync:proxy --contract-name SomeContract`.
- To provide a constructor arguments at deploy tasks, specify them after a `--contract-name` argument, e.g. `hardhat deploy-zksync:proxy --contract-name Greeter 'Hello'`.
- To provide a complex constructor argument list at deploy tasks, you can write a separate javascript module to export it and provide module name with `--constructor-args <module name>` argument, e.g.
`hardhat deploy-zksync:contract --contract-name ComplexContract --constructor-args args.js`. Example of `args.js` :
```typescript
module.exports = [
  "a string argument",
  "0xabcdef",
  "42",
  {
    property1: "one",
    property2: 2,
  },
];
```
- To provide a initializer method name at deploy tasks, add `--initializer <initializer method>`, e.g. `hardhat deploy-zksync:proxy --contract-name Contract --initializer store`. If this parameter is omitted, the default value will be `initialize`.
- To allows the task to skip the compilation process, add  `--no-compile` argument, e.g. `hardhat deploy-zksync:beacon --contract-name Contract --no-compile`.
- To specify inital contract owner, add `--initial-owner` argument, e.g `hardhat deploy-zksync:beacon --contract-name Contract --initial-owner 0xa61464658AfeAf65CccaaFD3a512b69A83B77618`. If this argument is ommited wallet address will be used.
- To allows the task to specify which deployer smart contract function will be called for implementation, add `--deployment-type-impl` argument, e.g. `hardhat deploy-zksync:beacon --contract-name Greeter 'Hello' --deployment-type-impl create2`.
- To allows the task to specify which deployer smart contract function will be called for proxy, add `--deployment-type-proxy` argument, e.g. `hardhat deploy-zksync:beacon --contract-name Greeter 'Hello' --deployment-type-proxy create2`.
- To specify which salt will be used in deployment of the implementation, add `--salt-impl` argument, e.g. `hardhat deploy-zksync:beacon --contract-name Greeter 'Hello' --salt-impl 0x42737956734178574166864921632769419836642485081335718122152413290`
- To specify which salt will be used in deployment of the proxy, add `--salt-proxy` argument, e.g. `hardhat deploy-zksync:beacon --contract-name Greeter 'Hello' --salt-proxy 0x42737956734178574166864921632769419836642485081335718122152413290`
- When utilizing the `upgrade-zksync:beacon` or `upgrade-zksync:proxy` tasks, specify the deployment type and salt using the `--deployment-type` and `--salt` arguments respectively.

Permissible values for the deployment type include `create`, `create2`, `createAccount`, and `create2Account`. If this parameter is omitted, the default value will be `create`.
If the salt parameters are ommited, the default value will be `0x0000000000000000000000000000000000000000000000000000000000000000`.

The account used for deployment will be the one specified by the `deployerAccount` configuration within the `hardhat.config.ts` file. If no such configuration is present, the account with index `0` will be used.

## 📝 Documentation

In addition to the [hardhat-zksync-upgradable](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-upgradable), ZKsync's Era [website](https://docs.zksync.io/build) offers a variety of resources including:

[Guides to get started](https://docs.zksync.io/build/start-coding/zksync-101): Learn how to start building on ZKsync Era.\
[Hardhat ZKsync Era plugins](https://docs.zksync.io/build/tooling/hardhat/getting-started): Overview and guides for all Hardhat ZKsync Era plugins.\
[ZK Chains](https://docs.zksync.io/zk-stack/concepts/zk-chains#what-are-zk-chains): Deep dive into the concept of ZK chains.

## 🤝 Contributing

Contributions are always welcome! Feel free to open any issue or send a pull request.

Go to [CONTRIBUTING.md](https://github.com/matter-labs/hardhat-zksync/blob/main/.github/CONTRIBUTING.md) to learn about steps and best practices for contributing to ZKsync hardhat tooling base repository.  


## 🙌 Feedback, help and news

[ZKsync Era Discord server](https://join.zksync.dev/): for questions and feedback.\
[Follow ZKsync Era on Twitter](https://twitter.com/zksync)

## Happy building!