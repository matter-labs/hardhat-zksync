import { Provider } from "zksync-ethers";
import * as chains from "viem/chains";
import { assert } from "chai";
import { innerGetTestClient } from "@nomicfoundation/hardhat-viem/internal/clients";
import { innerGetPublicClient } from "../src/internal/clients";
import { ZkSyncProviderAdapter } from "./provider-adapter-mock";

describe("clients", () => {
  describe("innerGetPublicClient", () => {
    const provider = new ZkSyncProviderAdapter(new Provider());

    it("should return a public client", async () => {
      const client = await innerGetPublicClient(
        provider,
        chains.zkSyncSepoliaTestnet
      );

      assert.isDefined(client);
      assert.equal(client.type, "publicClient");
      assert.equal(client.chain!.id, chains.zkSyncSepoliaTestnet.id);
    });

    it("should return a public client with custom parameters", async () => {
      const client = await innerGetPublicClient(
        provider,
        chains.zkSyncSepoliaTestnet,
        {
          pollingInterval: 1000,
          cacheTime: 2000,
        }
      );

      assert.equal(client.pollingInterval, 1000);
      assert.equal(client.cacheTime, 2000);
    });

    it("should return a public client with default parameters for zksync sepolia testnet", async () => {
      const client = await innerGetPublicClient(
        provider,
        chains.zkSyncSepoliaTestnet
      );
      assert.equal(client.pollingInterval, 4000);
      assert.equal(client.cacheTime, 4000);
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
