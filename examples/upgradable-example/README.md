# zkSync Era upgradable example

This project demonstrates how to compile and deploy upgadable smart contracts in zkSync Era using the Hardhat plugins.

## Prerequisites

- node.js 14.x or later.
- yarn.

## Configuration

Plugin configuration is located in [`hardhat.config.ts`](./hardhat.config.ts).
You should only change the zkSync network configuration.

`hardhat.config.ts` example with zkSync network configured with the name `zkTestnet` and `sepolia` used as the underlying layer 1 network:
```ts
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-upgradable';

import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    networks: {
        sepolia: {
            url: 'https://sepolia.infura.io/v3/<API_KEY>' // you can use either the URL of the Ethereum Web3 RPC, or the identifier of the network (e.g. `mainnet` or `rinkeby`)
        },
        zkTestnet: {
            url: 'https://sepolia.era.zksync.dev', // you should use the URL of the zkSync network RPC
            ethNetwork: 'sepolia',
            zksync: true
        },
    }
};

export default config;
```

If you don't specify zkSync network (`--network`), `local-setup` with <http://localhost:8545> (Ethereum RPC URL) and <http://localhost:3050> (zkSync RPC URL) will be used.

## Usage

Before using plugins, you need to build them first

```sh
# Run the following in the *root* of the repo.
yarn
yarn build
```

After that you should be able to run plugins:

```sh
# Run the following in `examples/upgradable-example` folder.
yarn
yarn hardhat compile
```

- `yarn hardhat compile`: compiles all the contracts in the `contracts` folder.

To run a specific end-to-end script in the `scripts` folder, use the following command

```
yarn hardhat run ./scipts/<SCRIPT_NAME>
```

- Example: `yarn hardhat run ./scripts/deploy-box-proxy.ts`