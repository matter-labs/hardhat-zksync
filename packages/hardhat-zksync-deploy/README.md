## hardhat-zksync-deploy 🚀

zkSync Era capabilities for contract deployment are enhanced with this [Hardhat](https://hardhat.org/) plugin, specifically designed to add zkSync-specific features to the network.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

This plugin provides utilities for deploying smart contracts on zkSync Era with artifacts built by the [@matterlabs/hardhat-zksync-solc](https://www.npmjs.com/package/@matterlabs/hardhat-zksync-solc) or [@matterlabs/hardhat-zksync-vyper](https://www.npmjs.com/package/@matterlabs/hardhat-zksync-vyper) plugins.

## ⚠️ Version Compatibility Warning

Ensure you are using the correct version of the plugin with ethers:
- For plugin version **<1.0.0**:
  - Compatible with ethers **v5**.

- For plugin version **≥1.0.0**:
  - Compatible with ethers **v6** (⭐ Recommended)

  ## ⚠️ New feature support

To use new features like the deployer extension inside Hardhat Runtime Environment (HRE), caching mechanism, and support for script paths, tags, dependencies, and priority, the plugin versions should be as follows:

- For **v6**, the version should be **1.2.0** or higher.
- For **v5**, the version should be **0.8.0** or higher.

## 📣 Prerequisite

- You are already familiar with deploying smart contracts on zkSync Era. If not, please refer to the first section of the [quickstart tutorail](https://era.zksync.io/docs/dev/building-on-zksync/hello-world.html).
- You have a wallet with sufficient Sepolia or Goerli **ETH** on L1 to pay for bridging funds to zkSync as well as deploying smart contracts. Use the third party faucets to get some test tokens in your account.
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
   * @param deploymentType Optional deployment type that relates to the ContractDeployer system contract function to be called. Defaults to deploying regular smart contracts.
```
 - `constructor(hre: HardhatRuntimeEnvironment, zkWallet: zk.Wallet, deploymentType?: zk.types.DeploymentType)`

```
   * Created a `Deployer` object on ethers.Wallet object.
   *
   * @param hre Hardhat runtime environment. This object is provided to scripts by hardhat itself.
   * @param ethWallet The wallet used to deploy smart contracts.
   * @param deploymentType The optional deployment type that relates to the `ContractDeployer` system contract function to be called. Defaults to deploying regular smart contracts.
```
 - `static fromEthWallet(hre: HardhatRuntimeEnvironment, ethWallet: ethers.Wallet, deploymentType?: zk.types.DeploymentType)`

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
   *
   * @returns Calculated fee in ETH wei.
   */
```
 - `public async estimateDeployFee(artifact: ZkSyncArtifact,constructorArguments: any[]): Promise<ethers.BigNumber>`

```
   * Sends a deploy transaction to the zkSync network.
   * For now it uses defaults values for the transaction parameters:
   *
   * @param artifact The previously loaded artifact object.
   * @param constructorArguments The list of arguments to be passed to the contract constructor.
   * @param forceDeploy Override cached deployment of the contract on the same network.
   * @param overrides Optional object with additional deploy transaction parameters.
   * @param additionalFactoryDeps Additional contract bytecodes to be added to the factory dependencies list.
   * The fee amount is requested automatically from the zkSync Era server.
   *
   * @returns A contract object.
```
 - `public async deploy(artifact: ZkSyncArtifact, constructorArguments: any[], forceDeploy: boolean = false, overrides?: OverridesadditionalFactoryDeps?: ethers.BytesLike[],): Promise<zk.Contract>`

```
   * Extracts factory dependencies from the artifact.
   *
   * @param artifact Artifact to extract dependencies from
   *
   * @returns Factory dependencies in the format expected by SDK.
```
 - `async extractFactoryDeps(artifact: ZkSyncArtifact): Promise<string[]>`

 ## Environment extensions

The plugin adds a deployer extension object to the Hardhat Runtime Environment (HRE), which allows us to access it using `hre.deployer`.

### Configuration

The configuration is extended to support automatic deployment without the need for manually creating a wallet. To achieve that, the `hardhat.config.ts` file needs to be extended by adding a `deployerAccounts` object, and specific network in the `networks` section need to be extended by adding `accounts` information.

```typescript
/// ADDITON
deployerAccounts: {
    'zkTestnet': 1, // The default index of the account for the specified network.
    //default: 0 // The default value for not specified networks. Automatically set by plugin to the index 0.
},
networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/<API_KEY>" // The Ethereum Web3 RPC URL (optional).
    },
    zkTestnet: {
      url: "https://sepolia.era.zksync.dev", // The testnet RPC URL of zkSync Era network.
      ethNetwork: "sepolia", // The Ethereum Web3 RPC URL, or the identifier of the network (e.g. `mainnet` or `sepolia`)
      zksync: true,
      /// ADDITON
      accounts: ['0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3', '0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959'] // The private keys for the accounts used in the deployment process.
    }
},
```

- `deployerAccounts` represents an object where the default index of the accounts is provided and automatically used in the deployment scripts. If the network name is not specified inside the object, the default index of the account will be 0.
- `accounts` represents a list of the private keys for the accounts used in the deployment process.

The described objects work together to provide users with a better deployment experience, eliminating the need for manual wallet initialization.

:::tip Accounts on zkSync Era Test Node or zksync-cli Local Node

`accounts` object will be automaticly be populated with rich accounts if used network is zkSync Era Test Node or zksync-cli Local Node

:::

### Methods

```typescript
  /**
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
   */
  public async loadArtifact(
    contractNameOrFullyQualifiedName: string
  ): Promise<ZkSyncArtifact>

  /**
   * Estimates the price of calling a deploy transaction in a certain fee token.
   *
   * @param artifact The previously loaded artifact object.
   * @param constructorArguments The list of arguments to be passed to the contract constructor.
   *
   * @returns Calculated fee in ETH wei.
   */
  public async estimateDeployFee(
    artifact: ZkSyncArtifact,
    constructorArguments: any[]
  ): Promise<ethers.BigNumber>

  /**
    * Sends a deploy transaction to the zkSync network.
    * For now it uses default values for the transaction parameters:
    *
    * @param artifact The previously loaded artifact object.
    * @param constructorArguments The list of arguments to be passed to the contract constructor.
    * @param forceDeploy Override cached deployment of the contract on the same network.
    * @param overrides Optional object with additional deploy transaction parameters.
    * @param additionalFactoryDeps Additional contract bytecodes to be added to the factory dependencies list.
    * The fee amount is requested automatically from the zkSync Era server.
    *
    * @returns A contract object.
    */
  public async deploy(
    artifact: ZkSyncArtifact,
    constructorArguments: any[],
    forceDeploy: boolean = false,
    overrides?: Overrides,
    additionalFactoryDeps?: ethers.BytesLike[],
  ): Promise<zk.Contract>


  /**
    * Set a new Wallet
    *
    * @param wallet object to be used in further deployment actions
    *
  */
  public async setWallet(
    wallet: zk.Wallet
  ): void

  /**
    * Returns a new Wallet connected to the selected network
    *
    * @param privateKeyOrAccountNumber Optional private key or index of the account
    *
    * @returns A wallet object. If param is not provided, default wallet will be returned.
  */
  public async getWallet(
    privateKeyOrAccountNumber?: string | number
  ): Promise<zk.Wallet>

    /**
   * Extracts factory dependencies from the artifact.
   *
   * @param artifact Artifact to extract dependencies from
   *
   * @returns Factory dependencies in the format expected by SDK.
   */
  async extractFactoryDeps(artifact: ZkSyncArtifact): Promise<string[]>
```

### Tranistion from `Deployer` object to the `hre.deployer`

With transition, the deployment logic remains the same, but instead of instantiating a `Deployer` class, you directly access the deployer object provided by `hre.deployer`. This simplifies the deployment process and enhances the developer experience.

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
const contract = await hre.deployer.deploy(artifact, [], false);
```

## Caching mechanism

The `hardhat-zksync-deploy` plugin supports a caching mechanism for contracts deployed on the same network, and by default, this feature is enabled for every deployment unless specified otherwise.
For each deployment within your project, a new `deployments` folder is created. Inside this folder, you can find subfolders for each network specified in the `hardhat.config.ts` file. Each network folder contains JSON files named after deployed contracts where caching purposes information are stored, and additionally, a `.chainId` file contains the chainId specific to that network.

The third parameter for each `deploy` call using the `Deployer` object or `hre.deployer` represents the `forceDeploy` parameter. This parameter enables you to specify whether the deployment should use the cached mechanism or be forcefully executed, overriding existing cached deployment.

```typescript
// Using Deploy exports for the deployment
const wallet = new zk.Wallet("PRIVATE_KEY");
const deployer = new Deployer(hre, zkWallet);
const artifact = await deployer.loadArtifact("ContractName");
const contract = await deployer.deploy(artifact, [], true); // forcefully executed
// Using hre.deployer with connected wallet provided by hardhat.config.ts configuration
const artifact = await hre.deployer.loadArtifact("ContractName");
const contract = await hre.deployer.deploy(artifact, [], true); // forcefully executed
```

## Scripts configuration

Scripts used for deployments have additional features that can provide the better experience and efficiency of the deployment process.

### Deployment scripts path

Configuring a scripts path can be achieved in two ways:

- setting up global paths used for all networks.
- configuring network-specific paths used exclusively for each network. This kind of paths overrides a global paths.

#### Global Deployment Paths

To configure global paths, the `hardhat.config.ts` configuration needs to be extended with a `deployPaths` property inside the `paths` section.

```typescript
paths: {
  //single deployment directory
  deployPaths: "deploy-zkSync";
  //multiple deployment directories
  deployPaths: ["deploy", "deploy-zkSync"];
}
```

- `deployPaths` Specify deployment directories, you can use either a single object or an array structure.

:::note default path

The default path, if not explicitly set, is the `deploy` folder inside the project's root directory.

:::

#### Network-Specific Deployment Paths

To configure network-specific paths, the `hardhat.config.ts` configuration needs to be extended with a `deployPaths` property inside the network object inside `networks` section.

```typescript
networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/<API_KEY>"
    },
    zkTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      //single deployment directory
      deployPaths: 'deploy-zkSync'
      //multiple deployment directories
      deployPaths: ['deploy', 'deploy-zkSync']
      zksync: true
    }
}
```

::: note override of global paths

Network-specific paths will override a global path, ensuring that only scripts within the directories configured for the specific network are executed.

:::

### Deployment scripts tags, dependencies and priority

Deployment scripts can be tagged, allowing for easy categorization and organization. Dependencies between scripts can be specified to ensure proper execution order, and priority levels can be assigned to determine the sequence in which scripts are run.

- `tags` An array of strings representing tags that can be assigned to scripts for categorization and organization.
- `dependencies` An array of scripts tags specifying the dependencies of a script, ensuring proper execution order based on their dependencies.
- `priority` An integer value indicating the priority level of a script, determining the sequence in which scripts are executed.

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

:::note default values
The default value for **tags** is `default`, and the default value for **priority** is `500`.
:::

## 📖 Example

After installing it, add the plugin to your Hardhat config:

`import "@matterlabs/hardhat-zksync-deploy";`

Then you'll be able to use the Deployer class in your files.

Create your script in **deploy** folder,

Import Deployer like this:

`import { Deployer } from '@matterlabs/hardhat-zksync-deploy';`

or

`const { Deployer } = require('@matterlabs/hardhat-zksync-deploy');`

Create a deployer instance:

`const deployer = new Deployer(hre, zkWallet);`

Note:
- **hre** - hardhat runtime enviroment
- **zkWallet** - instace of Wallet using [zksync-ethers](https://www.npmjs.com/package/zksync-ethers) plugin 

Load your contract artifacts:

`const artifact = await deployer.loadArtifact('Greeter');`

Deploy your contract:

`const myContract = await deployer.deploy(artifact, [...contractArguments]);`

Check the deployed address:

`const address = await myContract.getAddress()`

## 🕹 Commands

`yarn hardhat deploy-zksync` -- runs through all the scripts.
To run a specific script, add the `--script` argument, e.g. `yarn hardhat deploy-zksync --script 001_deploy.ts`. Runs script with name `001_deploy.ts`.
To run a scripts with specific tags add the `--tags` argument, e.g `yarn hardhat deploy-zksync --tags all`. Run all scripts with tag `all`.
`yarn hardhat deploy-zksync:libraries --private-key-or-index <PRIVATE_KEY>` -- uns compilation and deployment of missing libraries (the list of all missing libraries is provided by the output of [matterlabs/hardhat-zksync-solc](https://www.npmjs.com/package/@matterlabs/hardhat-zksync-solc) plugin). Read more about how zkSync deals with libraries on this [link](https://era.zksync.io/docs/tools/hardhat/compiling-libraries.html).

## 📝 Documentation

In addition to the [hardhat-zksync-deploy](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-deploy.html), zkSync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

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