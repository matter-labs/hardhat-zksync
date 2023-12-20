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

## 📥 Installation

To install **hardhat-zksync-deploy** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-deploy ethers zksync-ethers`

or

`yarn add -D @matterlabs/hardhat-zksync-deploy ethers zksync-ethers`

## 📖 Example

After installing it, add the plugin to your Hardhat config:

`import "@matterlabs/hardhat-zksync-deploy";`

Then you'll be able to use the Deployer class in your files.

Import it like:

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