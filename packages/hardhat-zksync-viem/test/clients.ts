import { Provider } from "zksync-ethers";
import { ZkSyncProviderAdapter } from "./provider-adapter-mock";
import * as chains from "viem/chains";
import {innerGetPublicClient,innerGetWalletClients,getWalletClient} from '../src/internal/clients'
import { assert } from "chai";
import { innerGetTestClient } from "@nomicfoundation/hardhat-viem/internal/clients";

describe("clients",() => {
    describe("innerGetPublicClient", () => {
        const provider = new ZkSyncProviderAdapter(new Provider());

        it("should return a public client", async () => {
            const client = await innerGetPublicClient(provider,chains.zkSyncSepoliaTestnet)

            assert.isDefined(client);
            assert.equal(client.type, "publicClient");
            assert.equal(client.chain!.id, chains.zkSyncSepoliaTestnet.id);
        });

        it("should return a public client with custom parameters", async () => {
            const client = await innerGetPublicClient(provider, chains.zkSyncSepoliaTestnet, {
              pollingInterval: 1000,
              cacheTime: 2000,
            });
      
            assert.equal(client.pollingInterval, 1000);
            assert.equal(client.cacheTime, 2000);
          });
      
          it("should return a public client with default parameters for zksync sepolia testnet", async () => {
            const client = await innerGetPublicClient(provider, chains.zkSyncSepoliaTestnet);
            assert.equal(client.pollingInterval, 4000);
            assert.equal(client.cacheTime, 4000);
          });
    });

    describe("innerGetWalletClients", () => {
      it("should return a list of wallet clients", async () => {
        const provider = new ZkSyncProviderAdapter(new Provider());
  
        const clients = await innerGetWalletClients(provider, chains.zkSyncSepoliaTestnet, [
          "0x1",
          "0x2",
        ]);
  
        assert.isArray(clients);
        assert.isNotEmpty(clients);
        clients.forEach((client) => {
          assert.equal(client.type, "walletClient");
          assert.equal(client.chain?.id, chains.zkSyncSepoliaTestnet.id);
        });
        assert.equal(clients[0].account?.address, "0x1");
        assert.equal(clients[1].account?.address, "0x2");
      });
  
      it("should return a list of wallet clients with custom parameters", async () => {
        const provider = new ZkSyncProviderAdapter(new Provider());
  
        const clients = await innerGetWalletClients(
          provider,
          chains.zkSyncSepoliaTestnet,
          ["0x1", "0x2"],
          {
            pollingInterval: 1000,
            cacheTime: 2000,
          }
        );
  
        assert.isArray(clients);
        assert.isNotEmpty(clients);
        clients.forEach((client) => {
          assert.equal(client.pollingInterval, 1000);
          assert.equal(client.cacheTime, 2000);
        });
      });
  
      it("should return a list of wallet clients with default parameters for zksync sepolia testnet", async () => {
        const provider = new ZkSyncProviderAdapter(new Provider());
  
        const clients = await innerGetWalletClients(provider, chains.zkSyncSepoliaTestnet, [
          "0x1",
          "0x2",
        ]);

        assert.isArray(clients);
        assert.isNotEmpty(clients);
        clients.forEach((client) => {
          assert.equal(client.pollingInterval, 4000);
          assert.equal(client.cacheTime, 4000);
        });
      });
    });

    describe("innerGetTestClient", () => {
      it("should return a test client with hardhat mode", async () => {
        const provider = new ZkSyncProviderAdapter(new Provider());
  
        const client = await innerGetTestClient(
          provider,
          chains.hardhat,
          "hardhat"
        );
  
        assert.isDefined(client);
        assert.equal(client.type, "testClient");
        assert.equal(client.chain.id, chains.hardhat.id);
        assert.equal(client.mode, "hardhat");
      });
  
      it("should return a test client with custom parameters", async () => {
        const provider = new ZkSyncProviderAdapter(new Provider());
  
        const client = await innerGetTestClient(
          provider,
          chains.hardhat,
          "hardhat",
          {
            pollingInterval: 1000,
            cacheTime: 2000,
          }
        );
  
        assert.equal(client.pollingInterval, 1000);
        assert.equal(client.cacheTime, 2000);
      });
  
      it("should return a test client with default parameters for development networks", async () => {
        const provider = new ZkSyncProviderAdapter(new Provider());
  
        const client = await innerGetTestClient(
          provider,
          chains.hardhat,
          "hardhat"
        );
  
        assert.equal(client.pollingInterval, 50);
        assert.equal(client.cacheTime, 0);
      });
    });
});