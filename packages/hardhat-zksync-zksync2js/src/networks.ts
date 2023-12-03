import { NetworkZkSyncConfig } from "./types";

export const zksyncNetworks: NetworkZkSyncConfig = {
    zkSyncTestnet: {
        url: "https://testnet.era.zksync.dev",
        ethNetwork: "goerli",
        zksync: true,
        verifyURL: "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
        gas: 'auto',
        gasPrice: 'auto',
        gasMultiplier: 0,
        timeout: 10000,
        httpHeaders: {},
        accounts: 'remote'
    },
      zkSyncMainnet: {
          url: "https://mainnet.era.zksync.io",
          ethNetwork: "mainnet",
          zksync: true,
          verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
          gas: 'auto',
          gasPrice: 'auto',
          gasMultiplier: 0,
          timeout: 10000,
          httpHeaders: {},
          accounts: "remote"
      },
      zkSyncDockerizedNode: {
          url: "http://localhost:3050",
          ethNetwork: "http://localhost:8545",
          zksync: true,
          gas: 'auto',
          gasPrice: 'auto',
          gasMultiplier: 0,
          timeout: 10000,
          httpHeaders: {},
          accounts: "remote"
      },
      zkSyncInMemoryNode: {
        url: "http://localhost:8011",
        ethNetwork: "", // in-memory node doesn't support eth node; removing this line will cause an error
        zksync: true,
        gas: 'auto',
        gasPrice: 'auto',
        gasMultiplier: 0,
        timeout: 10000,
        httpHeaders: {},
        accounts: "remote"
      }
    };