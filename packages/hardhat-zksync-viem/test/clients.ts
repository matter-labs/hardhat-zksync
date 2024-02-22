import { Provider } from "zksync-ethers";
import { ZkSyncProviderAdapter } from "./provider-adapter-mock";
import * as chains from "viem/chains";
import {innerGetPublicClient} from '../src/internal/clients'
import { assert } from "chai";

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
            const client = await innerGetPublicClient(provider, chains.mainnet, {
              pollingInterval: 1000,
              cacheTime: 2000,
            });
      
            assert.equal(client.pollingInterval, 1000);
            assert.equal(client.cacheTime, 2000);
          });
      
          it("should return a public client with default parameters for development networks", async () => {
            const client = await innerGetPublicClient(provider, chains.hardhat);
            assert.equal(client.pollingInterval, 50);
            assert.equal(client.cacheTime, 0);
          });
    });
});