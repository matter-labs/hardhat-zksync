# ZKsync Era zksync-ethers environment example

This project demonstrates how to compile and deploy your contracts in ZKsync Era using the Hardhat plugins.

## Prerequisites

- node.js 14.x or later.
- yarn.

## Configuration

Plugin configuration is located in [`hardhat.config.ts`](./hardhat.config.ts).
You should only change the ZKsync network configuration.

`hardhat.config.ts` example with ZKsync network configured with the name `zkTestnet` and `sepolia` used as the underlying layer 1 network:
```ts
import "@matterlabs/hardhat-zksync-deploy";
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    networks: {
        sepolia: {
            url: 'https://sepolia.infura.io/v3/<API_KEY>' // you can use either the URL of the Ethereum Web3 RPC, or the identifier of the network (e.g. `mainnet` or `rinkeby`)
        },
        zkTestnet: {
            url: 'https://sepolia.era.zksync.dev', // you should use the URL of the ZkSync network RPC
            ethNetwork: 'sepolia',
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
# Run the following in `examples/ethers-example` folder.
yarn
yarn hardhat compile
yarn hardhat deploy-zksync
```

- `yarn hardhat compile`: compiles all the contracts in the `contracts` folder.
- `yarn hardhat deploy-zksync`: runs all the deploy scripts in the `deploy` folder.
    - To run a specific script, add the `--script` argument, e.g. `--script 001_deploy.ts`.
    - To run on a specific ZKsync network, use standard hardhat `--network` argument, e.g. `--network zkTestnet`
    (with `zkTestnet` network specified in the `hardhat.config` networks section, with the `zksync` flag set to `true` and `ethNetwork` specified).

If you don't specify ZKsync network (`--network`), `local-setup` with <http://localhost:8545> (Ethereum RPC URL) and <http://localhost:3050> (ZKsync RPC URL) will be used.
