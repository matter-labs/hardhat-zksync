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
   * @param overrides Optional object with additional deploy transaction parameters.
   * @param additionalFactoryDeps Additional contract bytecodes to be added to the factory dependencies list.
   * The fee amount is requested automatically from the zkSync Era server.
   *
   * @returns A contract object.
```
 - `public async deploy(artifact: ZkSyncArtifact,constructorArguments: any[],overrides?: OverridesadditionalFactoryDeps?: ethers.BytesLike[],): Promise<zk.Contract>`

```
   * Extracts factory dependencies from the artifact.
   *
   * @param artifact Artifact to extract dependencies from
   *
   * @returns Factory dependencies in the format expected by SDK.
```
 - `async extractFactoryDeps(artifact: ZkSyncArtifact): Promise<string[]>`

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

`yarn hardhat deploy-zksync` -- runs through all the scripts in the **deploy** folder.\
`hardhat deploy-zksync --script script-name.ts` -- run a specific script from **deploy** folder.\
`yarn hardhat deploy-zksync:libraries --private-key <PRIVATE_KEY>` -- uns compilation and deployment of missing libraries (the list of all missing libraries is provided by the output of [matterlabs/hardhat-zksync-solc](https://www.npmjs.com/package/@matterlabs/hardhat-zksync-solc) plugin). Read more about how zkSync deals with libraries on this [link](https://era.zksync.io/docs/tools/hardhat/compiling-libraries.html).

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