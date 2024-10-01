## hardhat-zksync-deploy 🚀

ZKsync Era capabilities for contract deployment are enhanced with this [Hardhat](https://hardhat.org/) plugin, specifically designed to add ZKsync-specific features to the network.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

This plugin provides utilities for deploying smart contracts on ZKsync Era with artifacts built by the [@matterlabs/hardhat-zksync-solc](https://www.npmjs.com/package/@matterlabs/hardhat-zksync-solc) or [@matterlabs/hardhat-zksync-vyper](https://www.npmjs.com/package/@matterlabs/hardhat-zksync-vyper) plugins.

## ⚠️ Version Compatibility Warning

Ensure you are using the correct version of the plugin with ethers:
- For plugin version **<1.0.0**:
  - Compatible with ethers **v5**.

- For plugin version **≥1.0.0**:
  - Compatible with ethers **v6** (⭐ Recommended)

## ⚠️ Deployer extension inside Hardhat Runtime Environment (HRE)

To use features like the deployer extension inside Hardhat Runtime Environment (HRE), caching mechanism, and support for script paths, tags, dependencies, and priority, the plugin versions should be as follows:

- For **v6**, the version should be **1.2.0** or higher.
- For **v5**, the version should be **0.8.0** or higher.

## 📣 Prerequisite

- You are already familiar with deploying smart contracts on ZKsync Era. If not, please refer to the first section of the [quickstart tutorail](https://docs.zksync.io/build/start-coding/zksync-101).
- You have a wallet with sufficient Sepolia or Goerli **ETH** on L1 to pay for bridging funds to ZKsync as well as deploying smart contracts. Use the third party faucets to get some test tokens in your account.
- You know how to get your [private key from your MetaMask wallet](https://support.metamask.io/hc/en-us/articles/360015289632-How-to-export-an-account-s-private-key).

## 📥 Installation

To install **hardhat-zksync-deploy** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-deploy`

or

`yarn add -D @matterlabs/hardhat-zksync-deploy ethers zksync-ethers`


## 📤 Exports

The main export of this plugin is the Deployer class. It is used to wrap a zksync-ethers Wallet instance and provides a convenient interface to deploy smart contracts and account abstractions.
It's main methods are:

```
   * @param hre Hardhat runtime environment. This object is provided to scripts by hardhat itself.
   * @param zkWallet The wallet which will be used to deploy the contracts.
```
 - `constructor(hre: HardhatRuntimeEnvironment, zkWallet: zk.Wallet)`

```
   * Created a `Deployer` object on ethers.Wallet object.
   *
   * @param hre Hardhat runtime environment. This object is provided to scripts by hardhat itself.
   * @param ethWallet The wallet used to deploy smart contracts.
   * @param deploymentType The optional deployment type that relates to the `ContractDeployer` system contract function to be called. Defaults to deploying regular smart contracts.
```
 - `static fromEthWallet(hre: HardhatRuntimeEnvironment, ethWallet: ethers.Wallet)`

```
   * Loads an artifact and verifies that it was compiled by `zksolc`.
   *
   * @param contractNameOrFullyQualifiedName The name of the contract.
   *   It can be a bare contract name (e.g. "Token") if it's
   *   unique in your project, or a fully qualified contract name
   *   (e.g. "contract/token.sol:Token") otherwise.
   *
   * @throws Throws an error if a non-unique contract name is used,
   *   indicating which fully qualified names can be used instead.
   *
   * @throws Throws an error if an artifact was not compiled by `zksolc`.
```
 - `public async loadArtifact(contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact>`

```
   * Estimates the price of calling a deploy transaction in a certain fee token.
   *
   * @param artifact The previously loaded artifact object.
   * @param constructorArguments The list of arguments to be passed to the contract constructor.
   * @param deploymentType Optional deployment type that relates to the ContractDeployer system contract function to be called. Defaults to deploying regular smart contracts.
   * @returns Calculated fee in ETH wei.
   */
```
 - `public async estimateDeployFee(artifact: ZkSyncArtifact, constructorArguments: any[], deploymentType?: zk.types.DeploymentType): Promise<bigint>`

```
   * Sends a deploy transaction to the ZKsync network.
   * For now it uses defaults values for the transaction parameters:
   *
   * @param contractNameOrArtifact The previously loaded artifact object, or contract name that will be resolved to artifact in the background.
   * @param constructorArguments The list of arguments to be passed to the contract constructor.
   * @param deploymentType Optional deployment type that relates to the ContractDeployer system contract function to be called. Defaults to deploying regular smart contracts.
   * @param overrides Optional object with additional deploy transaction parameters.
   * @param additionalFactoryDeps Additional contract bytecodes to be added to the factory dependencies list.
   * The fee amount is requested automatically from the ZKsync Era server.
   *
   * @returns A contract object.
```
 - `public async deploy(contractNameOrArtifact: ZkSyncArtifact | string, constructorArguments: any[], deploymentType?: zk.types.DeploymentType, overrides?: OverridesAdditionalFactoryDeps?: ethers.BytesLike[],): Promise<zk.Contract>`

```
   * Extracts factory dependencies from the artifact.
   *
   * @param artifact Artifact to extract dependencies from
   *
   * @returns Factory dependencies in the format expected by SDK.
```
 - `async extractFactoryDeps(artifact: ZkSyncArtifact): Promise<string[]>`

 In the method description, it's evident that `contractNameOrArtifact` can accept two types of objects. One type represents a loaded artifact, while the other type is a string representing a contract name, which the deploy method will internally convert to the corresponding artifact.

 ```
const wallet = new zk.Wallet("PRIVATE_KEY");
const deployer = new Deployer(hre, zkWallet);
............
// Provided previously loaded artifact
const artifact = await deployer.loadArtifact("ContractName");
const contract = await deployer.deploy(artifact);
// Provided contract name
const contract = await deployer.deploy("ContractName");
 ```

 ## Environment extensions

The plugin adds a deployer extension object to the Hardhat Runtime Environment (HRE), which allows us to access it using `hre.deployer`.

### Configuration

To extend the configuration to support automatic deployment inside scripts without the need for manually creating a wallet, you can add an `accounts` field to the specific network configuration in the `networks` section of the `hardhat.config.ts` file. This accounts field can support an array of private keys or a mnemonic object.

If the `accounts` section contains an array of private keys, the deploy method will use index `0` by default unless another wallet is explicitly set in the script.

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
      accounts: ['0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3', '0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959'], // The private keys for the accounts used in the deployment process.
      accounts: {
          mnemonic: 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle'
      }
      // Mnemonic used in the deployment process
    }
  },
};
```

- `accounts` represents a list of the private keys or mnemonic object for the account used in the deployment process.

`accounts` object will be automaticly be populated with rich accounts if used network is ZKsync Era Test Node or zksync-cli Local Node

To establish a default index per network, which is by default `0`, you can include a `deployerAccounts` section in your `hardhat.config.ts` file. This enables the plugin to utilize the designated default indexes when accessing `deploy` method in deployment scripts, thereby granting greater control over the selection of the deployment account for each network.

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
      accounts: ['0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3', '0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959'],  // The private keys for the accounts used in the deployment process.
      accounts: {
          mnemonic: 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle'
      }  // Mnemonic used in the deployment process
    }
  },
};
```
- `deployerAccounts` represents an object where the default index of the accounts is provided and automatically used in the deployment scripts. If the network name is not specified inside the object, the default index of the account will be `0`. We can change and deafult index for not specified networks if we override `default` name with index that we want.

The described objects work together to provide users with a better deployment experience, eliminating the need for manual wallet initialization.

### Methods

Methods available for use in `hre.deployer` are the same as those available in the `Deployer` class object, as described above. Additionally, `hre.deployer` is extended with specific methods to facilitate the deployment process, making it more straightforward.

```
   /**
    * Set a new Wallet
    *
    * @param wallet object to be used in further deployment actions
    *
    */
```
- `setWallet(wallet: zk.Wallet): void`

```
   /**
    * Returns a new Wallet connected to the selected network
    *
    * @param privateKeyOrAccountNumber Optional private key or index of the account
    *
    * @returns A wallet object. If param is not provided, default wallet will be returned.
    */
```
- `async getWallet(privateKeyOrAccountNumber?: string | number): Promise<zk.Wallet>`

### Transition from `Deployer` object to the `hre.deployer`

The deployment logic remains the same, but instead of instantiating a `Deployer` class, you directly access the deployer object provided by `hre.deployer`. This simplifies the deployment process and enhances the developer experience.

```typescript
// Using Deploy exports for the deployment
const wallet = new zk.Wallet("PRIVATE_KEY");
const deployer = new Deployer(hre, zkWallet);
const artifact = await deployer.loadArtifact("ContractName");
const contract = await deployer.deploy(artifact, []);

// Using hre.deployer with connected wallet provided by hardhat.config.ts configuration
const artifact = await hre.deployer.loadArtifact("ContractName");
const contract = await hre.deployer.deploy(artifact, []);
```

### Usage of the getWallet and setWallet

To simplify and improve the user experience, you can use the `getWallet` and `setWallet` methods provided by `hre.deployer` to generate a new wallet for deployment if that is needed and to change current wallet.

```typescript
// To get the wallet for index 2 of the network accounts object inside hardhat.config.ts
const wallet = await hre.deployer.getWallet(2);
// To get the wallet for the provided private key
const wallet = await hre.deployer.getWallet("0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959");

// Set a new wallet
hre.deployer.setWallet(wallet);

const artifact = await hre.deployer.loadArtifact("ContractName");
const contract = await hre.deployer.deploy(artifact, []);
```

## Caching mechanism

The `hardhat-zksync-deploy` plugin supports a caching mechanism for contracts deployed on the same network, and by default, this feature is enabled for every deployment with specific network unless specified otherwise. For each deployment within your project, a new `deployments-zk` folder is created. Inside this folder, you can find subfolders for each network specified in the `hardhat.config.ts` file. Each network folder contains JSON files named after deployed contracts where caching purposes information are stored, and additionally, a `.chainId` file contains the chainId specific to that network.

To explicitly use a cache mechanism or force deploy for a specific network in your `hardhat.config.ts` file, you would indeed need to set the `forceDeploy` flag for that network in the networks section.

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
      forceDeploy: true // Specify is deploy process will use cache mechanism or it will force deploy of the contracts
    }
  },
}

```

If the `forceDeploy` flag is set to `true` for a specific network in your `hardhat.config.ts` file, it indicates that the deployment process will force deploy contracts to that network, bypassing any cache mechanism.

Conversely, if the `forceDeploy` flag is set to `false` or not specified for a network, `hardhat-zksync-deploy` will use caching mechanism during deployment. This means it will check whether the contracts have changed since the last deployment, and if not, it will reuse the already deployed contracts instead of redeploying them.
If a `forceDeploy` isn't explicitly defined, it automatically defaults to `true`.

## Scripts configuration

Scripts used for deployments have additional features that can provide the better experience and efficiency of the deployment process.

### Deployment scripts path

Configuring a scripts path can be achieved in two ways:

- setting up global paths used for all networks.
- configuring network-specific paths used exclusively for each network. This kind of paths overrides a global paths.

#### Global Deployment Paths

To enable the plugin's usage of global custom deploy scripts, specify the directory path containing these scripts within the `deployPaths` section nested inside the `paths` section of your `hardhat.config.ts` file.

```typescript
const config: HardhatUserConfig = {
  // ADDITON
  paths: {
    deployPaths: "deploy-ZKsync",  //single deployment directory
    deployPaths: ["deploy", "deploy-ZKsync"], //multiple deployment directories
  }
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
}
```

- `deployPaths` Specify deployment directories, you can use either a single object or an array structure.

The default path, if not explicitly set, is the `deploy` folder inside the project's root directory.

#### Network-Specific Deployment Paths

To configure network-specific paths, the `hardhat.config.ts` configuration needs to be extended with a `deployPaths` property inside the network object inside `networks` section.

```typescript
const config: HardhatUserConfig = {
networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/<API_KEY>"
    },
    zkTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      // ADDITION
      deployPaths: 'deploy-ZKsync', //single deployment directory
      deployPaths: ['deploy', 'deploy-ZKsync'], //multiple deployment directories
      zksync: true
    }
  }
}
```

Network-specific paths will override a global path, ensuring that only scripts within the directories configured for the specific network are executed.

### Deployment scripts, tags, dependencies and priority

Deployment scripts can be tagged, allowing for easy categorization and organization. Dependencies between scripts can be specified to ensure proper execution order, and priority levels can be assigned to determine the sequence in which scripts are run.

- `tags` An array of strings representing lables that can be assigned to scripts for categorization and organization.
- `dependencies` An array of script tags specifying the dependencies of a script, ensuring proper execution order based on their dependencies.
- `priority` An integer value indicating the priority level of a script, determining the sequence in which scripts are executed. If a script has a higher value for priority field, it will be executed first unless it depends on another script.

Examples:

```typescript
// Script 001_deploy.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployScript = async function (_: HardhatRuntimeEnvironment) {
  console.log("Deploy script");
};

export default deployScript;
deployScript.priority = 800;
deployScript.tags = ["first"];
deployScript.dependencies = ["second"];

// Script 002_deploy.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployScript = async function (_: HardhatRuntimeEnvironment) {
  console.log("Deploy script");
};

export default deployScript;
deployScript.priority = 650;
deployScript.tags = ["second"];

// Script 003_deploy.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployScript = async function (_: HardhatRuntimeEnvironment) {
  console.log("Deploy script");
};

export default deployScript;
deployScript.priority = 1000;
```

For the specific scripts, we observe that `001_deploy.ts` and `002_deploys.ts` are tagged, and `001_deploy.ts` depends on deployment scripts with the tag `second`. Additionally, a priority is set for all three scripts. As a result, when starting the deployment process (running scripts), the order of script execution will be as follows:

1. `003_deploys.ts`: This script has the highest priority and is not dependent on any other script.
2. `002_deploy.ts`: This script needs to be executed second because it is tagged with `second`, and `001_deploy.ts` depends on that script.
3. `001_deploy.ts`: Although this script has a higher priority than `002_deploy.ts`, it depends on the latter, so it will be executed last.

The default value for **tags** is `default`, and the default value for **priority** is `0`.

## 📖 Example

Note:
- **hre** - hardhat runtime environment
- **zkWallet** - instance of Wallet using [zksync-ethers](https://www.npmjs.com/package/zksync-ethers) SDK 

### Deployer class usage

After installing it, add the plugin to your Hardhat config:

`import "@matterlabs/hardhat-zksync-deploy";`

Then you'll be able to use the Deployer class in your files.

Create your script in the **deploy** folder or in any folder that you have specified inside the `hardhat.config.ts` file,

Import Deployer like this:

`import { Deployer } from '@matterlabs/hardhat-zksync-deploy';`

or

`const { Deployer } = require('@matterlabs/hardhat-zksync-deploy');`

Create a deployer instance:

`const deployer = new Deployer(hre, zkWallet);`

Load your contract artifacts:

`const artifact = await deployer.loadArtifact('Greeter');`

Deploy your contract:

`const myContract = await deployer.deploy(artifact, [...contractArguments]);`

Check the deployed address:

`const address = await myContract.getAddress();`

### hre.deployer usage

After installing it, add the plugin to your Hardhat config:

`import "@matterlabs/hardhat-zksync-deploy";`

Create your script in the **deploy** folder or in any folder that you have specified inside the `hardhat.config.ts` file,

Load your contract artifacts:

`const artifact = await hre.deployer.loadArtifact('Greeter');`

Deploy your contract:

`const myContract = await hre.deployer.deploy(artifact, [...contractArguments]);`

Check the deployed address:

`const address = await myContract.getAddress();`

## 🕹 Commands

`yarn hardhat deploy-zksync` -- runs through all the scripts.

To run a specific script, add the `--script` argument, e.g. `yarn hardhat deploy-zksync --script 001_deploy.ts`. Runs script with name `001_deploy.ts`.

To run a scripts with specific tags add the `--tags` argument, e.g `yarn hardhat deploy-zksync --tags all`. Run all scripts with tag `all`.

`yarn hardhat deploy-zksync:libraries` -- compilation and deployment of missing libraries (the list of all missing libraries is provided by the output of [matterlabs/hardhat-zksync-solc](https://www.npmjs.com/package/@matterlabs/hardhat-zksync-solc) plugin). Read more about how ZKsync deals with libraries on this [link](https://docs.zksync.io/build/tooling/hardhat/compiling-libraries).
The account used for deployment will be the one specified by the `deployerAccount` configuration within the `hardhat.config.ts` file. If no such configuration is present, the account with index `0` will be used.

`yarn hardhat deploy-zksync:contract --contract-name <contract name or FQN>`

This command provides an easy and fast way to deploy one contract. If the provided command for deploying a single contract is insufficient and you require additional flexibility, such as incorporating additional dependencies or overrides, it would be advisable to utilize a script-based approach.
When executed, this command deploys the provided contract on the specified network, using the provided contract constructor arguments.

- To provide a contract name or FQN, required argument in the task, add a `--contract-name <contract name or FQN>` argument, e.g. `hardhat deploy-zksync:contract --contract-name SomeContract`.
- To provide a constructor arguments, specify them after a `--contract-name` argument, e.g. `hardhat deploy-zksync:contract --contract-name Greeter 'Hello'`.
- To provide a complex constructor argument list, you can write a separate javascript module to export it and provide module name with `--constructor-args <module name>` argument, e.g.
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
- To allows the task to skip the compilation process, add  `--no-compile` argument, e.g. `hardhat deploy-zksync:contract --contract-name Contract --no-compile`.
- To allows the task to specify which deployer smart contract function will be called, add `--deployment-type` argument. Permissible values for this parameter include `create`, `create2`, `createAccount`, and `create2Account`. If this parameter is omitted, the default value assumed will be `create`, e.g. `hardhat deploy-zksync:contract --contract-name Greeter 'Hello' --deployment-type create2`.
- To specify which salt will be used in deployment, add `--salt` argument. If the salt parameters are ommited, the default value will be `0x0000000000000000000000000000000000000000000000000000000000000000`.
The account used for deployment will be the one specified by the `deployerAccount` configuration within the `hardhat.config.ts` file. If no such configuration is present, the account with index `0` will be used.

## 📝 Documentation

In addition to the [hardhat-zksync-deploy](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-deploy), ZKsync's Era [website](https://docs.zksync.io/build) offers a variety of resources including:

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