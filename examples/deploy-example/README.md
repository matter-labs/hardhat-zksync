# ZKsync Era deploy environment example

This project demonstrates how to compile and deploy your contracts in ZKsync Era using the Hardhat plugins.

## Prerequisites

- node.js 16.x or later.
- yarn.

## Configuration

Plugin configuration is located in [`hardhat.config.ts`](./hardhat.config.ts).
You should only change the ZKsync network configuration.

`hardhat.config.ts` example with ZKsync network configured with the name `ZKsyncNetwork` and `ethNetwork` used as the underlying layer 1 network:
```ts
import "@matterlabs/hardhat-zksync-deploy";
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    networks: {
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        ZKsyncNetwork: {
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            zksync: true,
            deployPaths: ['deploy-ZKsync', 'deploy'],
            accounts: ['0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3', '0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959'],
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
# Run the following in `examples/basic-example` folder.
yarn
yarn hardhat compile
yarn hardhat deploy-zksync
```

- `yarn hardhat compile`: compiles all the contracts in the `contracts` folder.
- `yarn hardhat deploy-zksync`: runs all the deploy scripts.
    - To run a specific script, add the `--script` argument, e.g. `--script 002_deploy.ts`.
    - To run on a specific ZKsync network, use standard hardhat `--network` argument, e.g. `--network ZKsyncNetworkV2`
    (with `ZKsyncNetwork` network specified in the `hardhat.config` networks section, with the `zksync` flag set to `true` and `ethNetwork` specified).

If you don't specify ZKsync network (`--network`), `local-setup` with <http://localhost:8545> (Ethereum RPC URL) and <http://localhost:3050> (ZKsync RPC URL) will be used.
