# zkSync 2.0 verify environment example

This project demonstrates how to compile and verify your contracts in zkSync 2.0 using the Hardhat plugins.

## Prerequisites

- node.js 14.x or later.
- yarn.

## Configuration

Plugin configuration is located in [`hardhat.config.ts`](./hardhat.config.ts).
You should only change the zkSync network configuration.

`hardhat.config.ts` example with zkSync network configured with the name `zkTestnet` and `sepolia` used as the underlying layer 1 network:
```ts
import "@matterlabs/hardhat-zksync-deploy";
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
     networks: {     
        zkTestnet: {
            url: "https://sepolia.era.zksync.dev",
            ethNetwork: "sepolia",
            zksync: true,
            verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
            accounts: [PRIVATE KEY], //provide private key
        },
        customNetwork: {
            zksync: true,
            url: '',
            ethNetwork: 'unknown',
        }
    },

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
# Run the following in `examples/verify-example` folder.
yarn
yarn hardhat test
```
