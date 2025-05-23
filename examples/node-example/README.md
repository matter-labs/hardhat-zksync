# ZKsync Era node environment example

This project demonstrates how to run [anvil-zksync](https://docs.zksync.io/build/test-and-debug/in-memory-node) locally using the zksync's `hardhat-zksync-node` Hardhat plugin for testing purposes.

## Prerequisites

- node.js 14.x or later.
- yarn.

## Configuration

Plugin configuration is located in [`hardhat.config.ts`](./hardhat.config.ts).

`hardhat.config.ts` example with the hardhat network's zksync set to true::
```ts

import "@matterlabs/hardhat-zksync-deploy";
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            zksync: true
        },
    }
};

export default config;
```

## Usage

Before using plugins, you need to build them first

```sh
# Run the following in the *root* of the repo.
yarn
yarn build
```

After that you should be able to run plugins:

```sh
# Run the following in `examples/node-example` folder.
yarn
yarn hardhat compile
yarn hardhat deploy-zksync
yarn hardhat test
```

- `yarn hardhat compile`: compiles all the contracts in the `contracts` folder.
- `yarn hardhat deploy-zksync`: runs all the deploy scripts in the `deploy` folder.
- `yarn hardhat test`: runs all the tests against the anvil-zksync instance instantiated in a separate process.
