# zkSync 2.0 node environment example

This project demonstrates how to run [era-test-node](https://era.zksync.io/docs/tools/testing/era-test-node.html) locally using the zksync's `hardhat-zksync-node` Hardhat plugin for testing purposes.

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
- `yarn hardhat test`: runs all the tests against the era-test-node instance instantiated in a separate process.
