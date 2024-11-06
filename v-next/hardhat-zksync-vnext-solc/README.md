# hardhat-zksync-solc 🚀

ZKsync Era [Hardhat](https://hardhat.org/) plugin to compile smart contracts for the ZKsync network.

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
      enableEraVMExtensions: false, // optional.  Enables Yul instructions available only for ZKsync system contracts and libraries. In the older versions of the plugin known as 'isSystem' flag
      forceEVMLA: false, // Compile with EVM legacy assembly codegen. In the older versions of the plugin known as a 'forceEvmla' flag
      optimizer: {
        enabled: true, // optional. True by default
        mode: '3' // optional. 3 by default, z to optimize bytecode size
        fallback_to_optimizing_for_size: false, // optional. Try to recompile with optimizer mode "z" if the bytecode is too large
      },
      suppressedWarnings: ['txorigin', 'sendtransfer'], // Suppress specified warnings. Currently supported: txorigin, sendtransfer
      suppressedErrors: ['txorigin', 'sendtransfer'], // Suppress specified errors. Currently supported: txorigin, sendtransfer
      experimental: {
        dockerImage: '', // deprecated
        tag: ''   // deprecated
      },
    }
},
```

The `isSystema` and `forceEvmla` arguments are deprecated in favor of `enableEraVMExtensions` and `forceEVMLA`. If the deprecated arguments are used, a warning will be displayed and they will be automatically switched to the new naming with the provided values.

Starting from zksolc version 1.5.0, the ZKsync Era Solidity compiler will be used by default with the latest version if not specified in hardhat.config.ts


| 🔧 Properties               | 📄 Description                                                                                                       |
|-----------------------------|----------------------------------------------------------------------------------------------------------------------|
| version                     | zksolc compiler version.                                                                                             |
| compilerSource              | Indicates the compiler source and can be either binary (default) or docker (deprecated).                             |
| compilerPath                | (optional) field with the path to the zksolc binary. By default, the binary in $PATH is used                         |
| libraries                   | If your contract uses non-inlinable libraries as dependencies, they have to be defined here.                         |
| missingLibrariesPath        | (optional) serves as a cache that stores all the libraries that are missing or have dependencies on other libraries. |
| enableEraVMExtensions                    | Required if contracts use enables Yul instructions available only for ZKsync system contracts and libraries. In the older versions of the plugin known as 'isSystem' flag          |
| forceEVMLA                  | Compile with EVM legacy assembly codegen. If the zksolc version is below 1.5.0, this argument will act as a 'forceEvmla' flag in the older versions of the plugin, attempting to fallback to EVM legacy assembly if there is a bug with Yul.                        |
| optimizer                   | Compiler optimizations (enabled: true (default) or false), mode: 3 (default), fallback_to_optimizing_for_size: false (default) recommended for most projects.          |
| suppressedWarnings          | Suppress specified warnings. Currently supported: txorigin, sendtransfer                                                                                                       |
| suppressedErrors            | Suppress specified errors. Currently supported: txorigin, sendtransfer                                                                                                       |
| metadata                    | Metadata settings. If the option is omitted, the metadata hash appends by default: bytecodeHash. Can only be none.   |
| dockerImage                 | (deprecated) option used to identify the name of the compiler docker image.                                          |

Learn more about [compiling libraries here](https://docs.zksync.io/build/tooling/hardhat/compiling-libraries)

Setting the forceEVMLA field to true can have the following negative impacts:

- No support for recursion.
- No support for internal function pointers.
- Possible contract size and performance impact.

### ZKsync Era Solidity compiler

Due to [the identified limitations](https://docs.zksync.io/zk-stack/components/compiler/toolchain/solidity.html#limitations) of the [upstream Solidity compiler](https://github.com/ethereum/solidity), our team has developed [a new edition](https://github.com/matter-labs/era-solidity) of the compiler, which effectively addresses and resolves these constraints.

For usage of EraVM  compiler, `eraVersion` should be added inside `solidity` property in the `hardhat.config.ts` file:

```typescript
solidity: {
    version: "0.8.17",
    eraVersion: "1.0.0" //optional. Compile contracts with EraVM compiler
},
```

| 🔧 Properties               | 📄 Description                                                                                                       |
|-----------------------------|----------------------------------------------------------------------------------------------------------------------|
| eraVersion                     | (optional) is field used to specify version of EraVM compiler

## 🕹 Commands

`yarn hardhat compile`

Compiles all the smart contracts in the contracts directory and creates the artifacts-zk folder with all the compilation artifacts, including factory dependencies for the contracts, which could be used for contract deployment.

## 📝 Documentation

In addition to the [hardhat-zksync-solc](https://docs.zksync.io/build/tooling/hardhat/hardhat-zksync-solc), ZKsync's Era [website](https://docs.zksync.io/build) offers a variety of resources including:

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