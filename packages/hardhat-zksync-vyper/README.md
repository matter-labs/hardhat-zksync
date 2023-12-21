# hardhat-zksync-vyper 🚀

[Hardhat](https://hardhat.org/) plugin that adds zkSync-specific capabilities to vyper.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

## 📥 Installation

To install **hardhat-zksync-vyper** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-vyper`

or

`yarn add -D @matterlabs/hardhat-zksync-vyper @nomiclabs/hardhat-vyper`

## 🔧 Setup

**Scaffold a new project**

Use the zkSync Era cli to set up a project.

`npx zksync-cli@latest create project greeter-vyper-example --template hardhat_vyper`
`cd greeter-vyper-example`


Update the hardhat.config.ts file with: 

`import "@matterlabs/hardhat-zksync-vyper";`


**Create a simple vyper contract**

The zkSync Era cli generates a contracts folder which includes a Greeter.sol contract.

- Delete Greeter.sol from the contracts/ directory.
- Add the equivalent Greeter.vy Vyper contract:

```
# @version ^0.3.3

greeting: constant(String[100]) = "Hello, World!"

@external
@view
def greet() -> String[100]:
    return self.greeting
```

**Compile the contract**

`yarn hardhat compile`

**Create deployment script**

First update the use-greeter.ts script, supplied by the CLI in the deploy/ directory by importing contract from correct location.

`import * as ContractArtifact from "../artifacts-zk/contracts/Greeter.vy/Greeter.json";`

**Add private key to environment variables**

Remove example from the .env.example file and add your private key to <WALLET-PRIVATE-KEY>.

Deploy the contract

`yarn hardhat deploy-zksync --script deploy-greeter.ts`

**Output**

You should see something like this:

```
Running deploy function for the Greeter contract
The deployment is projected to cost 0.000135806 ETH
constructor args:0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000094869207468657265210000000000000000000000000000000000000000000000
Greeter was deployed to 0x7CDF8A4334fafE21B8dCCe70487d6CBC00183c0d
```

## 📝 Documentation

In addition to the [hardhat-zksync-vyper](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-vyper.html), zkSync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

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