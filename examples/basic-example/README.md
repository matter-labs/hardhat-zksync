# zkSync 2.0 deploy environment example

This project demonstrates how to compile and deploy your contracts in zkSync 2.0 using the Hardhat plugins.

## Prerequisites

- node.js 14.x or later.
- yarn.

## Configuration

Plugin configuration is located in [`hardhat.config.ts`](./hardhat.config.ts).
You should only change the zkSync network configuration.

For `ethNetwork`, you can use either the URL of the Ethereum Web3 RPC, or the identifier of the network (e.g. `mainnet` or `rinkeby`).
For `zkSyncNetwork`, you should use the URL of the zkSync network RPC.

## Usage

Before using plugins, you need to build them first

```sh
# Run the following in the *root* of the repo.
yarn
yarn build
```

After that you should be able to run plugins:

```sh
# Run the following in `examples/basic-example` folder.
yarn
yarn hardhat compile
yarn hardhat deploy-zksync
```

- `yarn hardhat compile`: compiles all the contracts in the `contracts` folder.
- `yarn hardhat deploy-zksync`: runs all the deploy scripts in the `deploy` folder.
    - To run a specific script, add the `--script` argument, e.g. `--script 001_deploy.ts`.
