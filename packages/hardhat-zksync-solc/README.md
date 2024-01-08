# hardhat-zksync-solc 🚀

zkSync Era [Hardhat](https://hardhat.org/) plugin to compile smart contracts for the zkSync network.

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

## 📥 Installation

To install **hardhat-zksync-solc** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-solc`

or

`yarn add -D @matterlabs/hardhat-zksync-solc`

## 🔩 Configuration

Import the package in the hardhat.config.ts file:

`import "@matterlabs/hardhat-zksync-solc";`

Any configuration parameters should be added inside a zksolc property in the hardhat.config.ts file:

```
zksolc: {
    version: "latest", // optional.
    settings: {
      compilerPath: "zksolc",  // optional. Ignored for compilerSource "docker". Can be used if compiler is located in a specific folder
      libraries:{}, // optional. References to non-inlinable libraries
      missingLibrariesPath: "./.zksolc-libraries-cache/missingLibraryDependencies.json" // optional. This path serves as a cache that stores all the libraries that are missing or have dependencies on other libraries. A `hardhat-zksync-deploy` plugin uses this cache later to compile and deploy the libraries, especially when the `deploy-zksync:libraries` task is executed
      isSystem: false, // optional.  Enables Yul instructions available only for zkSync system contracts and libraries
      forceEvmla: false, // optional. Falls back to EVM legacy assembly if there is a bug with Yul
      optimizer: {
        enabled: true, // optional. True by default
        mode: '3' // optional. 3 by default, z to optimize bytecode size
      },
      experimental: {
        dockerImage: '', // deprecated
        tag: ''   // deprecated
      },
    }
},
```
| 🔧 Properties               | 📄 Description                                                                                                       |
|-----------------------------|----------------------------------------------------------------------------------------------------------------------|
| version                     | zksolc compiler version.                                                                                             |
| compilerSource              | Indicates the compiler source and can be either binary (default) or docker (deprecated).                             |
| compilerPath                | (optional) field with the path to the zksolc binary. By default, the binary in $PATH is used                         |
| libraries                   | If your contract uses non-inlinable libraries as dependencies, they have to be defined here.                         |
| missingLibrariesPath        | (optional) serves as a cache that stores all the libraries that are missing or have dependencies on other libraries. |
| isSystem                    | Required if contracts use enables Yul instructions available only for zkSync system contracts and libraries          |
| forceEvmla                  | Falls back to EVM legacy assembly if there is an issue with the Yul IR compilation pipeline.                         |
| optimizer                   | Compiler optimizations (enabled: true (default) or false), mode: 3 (default) recommended for most projects.          |
| metadata                    | Metadata settings. If the option is omitted, the metadata hash appends by default: bytecodeHash. Can only be none.   |
| dockerImage                 | (deprecated) option used to identify the name of the compiler docker image.                                          |

Learn more about [compiling libraries here](https://era.zksync.io/docs/tools/hardhat/compiling-libraries.html)

Setting the forceEvmla field to true can have the following negative impacts:

- No support for recursion.
- No support for internal function pointers.
- Possible contract size and performance impact.

## 🕹 Commands

`yarn hardhat compile`

Compiles all the smart contracts in the contracts directory and creates the artifacts-zk folder with all the compilation artifacts, including factory dependencies for the contracts, which could be used for contract deployment.

## 📝 Documentation

In addition to the [hardhat-zksync-solc](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-solc.html), zkSync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

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