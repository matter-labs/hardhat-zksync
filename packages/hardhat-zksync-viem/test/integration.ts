import { assert,expect } from "chai";

import { useEnvironment } from "./helpers";

import * as chains from 'viem/chains'
import { http, parseEther } from "viem";

describe("Integration tests", function () {
  useEnvironment("hardhat-project");

  describe("Hardhat Runtime Environment extension", function () {
    it("should add the viem object and it's properties", function () {
      expect(this.hre.zksyncViem)
        .to.be.an("object")
        .that.has.all.keys([
          "getPublicClient",
          "getWalletClients",
          "getWalletClient",
        ]);
    });
  });

  describe("Viem plugin", function () {
    it("should be able to query the blockchain using the public client", async function () {
      const client = await this.hre.zksyncViem.getPublicClient();
      const blockNumber = await client.getBlockNumber();

      assert.equal(blockNumber, 0n);
    });

    it("should be able to query the blockchain using the wallet client", async function () {
      const publicClient = await this.hre.zksyncViem.getPublicClient();
      const [fromWalletClient, toWalletClient] =
        await this.hre.zksyncViem.getWalletClients();
      const fromAddress = fromWalletClient.account!.address;
      const toAddress = toWalletClient.account!.address;

      const fromBalanceBefore: bigint = await publicClient.getBalance({
        address: fromAddress,
      });
      const toBalanceBefore: bigint = await publicClient.getBalance({
        address: toAddress,
      });

      const etherAmount = parseEther("0.0001");
      //@ts-ignore
      const hash = await fromWalletClient.sendTransaction({
        to: toAddress,
        value: etherAmount,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const transactionFee = receipt.gasUsed * receipt.effectiveGasPrice;

      const fromBalanceAfter: bigint = await publicClient.getBalance({
        address: fromAddress,
      });
      const toBalanceAfter: bigint = await publicClient.getBalance({
        address: toAddress,
      });

      assert.isDefined(receipt);
      assert.equal(receipt.status, "success");
      assert.equal(
        fromBalanceAfter,
        fromBalanceBefore - etherAmount - transactionFee
      );
      assert.equal(toBalanceAfter, toBalanceBefore + etherAmount);
    });

    describe("should be able to query the blockchain using the public client on zksync sepolia testnet", async function () {
      it("should be able to query the blockNumber", async function () {
        const client = await this.hre.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http()
        });
        const blockNumber = await client.getBlockNumber();
        assert(blockNumber > 0, "Block number should be greater than 0");
      });

      it("should be able to query the account balance", async function () {
        const client = await this.hre.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http()
        });
        const balance = await client.getBalance({address:'0x0000000000000000000000000000000000000000'});
        assert(balance > 0, "Balance of 0x0000000000000000000000000000000000000000 should probably be > 0");
      });

      it("should be able to query the block", async function () {
        const client = await this.hre.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http()
        });
        const block = await client.getBlock({blockNumber:1n});
        assert("hash" in block, "Block should have had a hash propery");
        assert("miner" in block, "Block should have had a miner propery");
        assert("transactions" in block, "Block should have had a transactions propery");
      });

      it("should be able to query the gas price", async function () {
        const client = await this.hre.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http()
        });
        const gasPrice = await client.getGasPrice();
        assert(gasPrice > 0, "gas price should be greater than 0");
      });

      it("should be able to query the gas price", async function () {
        const client = await this.hre.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http()
        });
        const chainId = await client.getChainId();
        assert.equal(chainId,300);
      });
    })
  });
});