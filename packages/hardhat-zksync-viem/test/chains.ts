import { Provider } from "zksync-ethers";
import { expect } from "chai";
import sinon from "sinon";
import * as chains from "viem/chains";
import { getChain, isDevelopmentNetwork } from "../src/internal/chains";
import { ZkSyncProviderAdapter } from "./provider-adapter-mock";

describe("chains", () => {
  describe("getChain", async () => {
    it("should return the chain corresponding to the chain id", async () => {
      const provider = new ZkSyncProviderAdapter(
        new Provider("https://sepolia.era.zksync.dev")
      );
      const sendStub = sinon.stub(provider, "send");
      sendStub.withArgs("eth_chainId").returns(Promise.resolve(300));
      sendStub.withArgs("hardhat_metadata").throws();

      const chain = await getChain(provider);
      expect(chain).to.deep.equal(chains.zkSyncSepoliaTestnet);
    });
    it("should return the hardhat chain if the chain id is 31337 and the network is hardhat", async () => {
      const provider = new ZkSyncProviderAdapter(new Provider(""));
      const sendStub = sinon.stub(provider, "send");
      sendStub.withArgs("eth_chainId").returns(Promise.resolve("31337"));
      sendStub.withArgs("hardhat_metadata").returns(Promise.resolve({}));

      const chain = await getChain(provider);
      expect(chain).to.deep.equal(chains.hardhat);
    });
  });

  describe("isDevelopmentNetwork", () => {
    it("should return true if the chain id is 31337", () => {
      expect(isDevelopmentNetwork(31337));
    });

    it("should return false if the chain id is not 31337", () => {
      expect(!isDevelopmentNetwork(1));
    });
  });
});
