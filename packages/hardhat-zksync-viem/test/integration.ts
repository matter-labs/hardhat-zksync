import { assert, expect } from "chai";

import * as chains from "viem/chains";
import { PublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { useEnvironment } from "./helpers";
import { WALLET_ADDRESS_1, WALLET_ADDRESS_2 } from "./constants";
import "../src/internal/type-extensions";

describe("Plugin tests", async function () {
  // useEnvironment("hardhat-project", "testnet");
  describe.skip("Hardhat Zksync Viem plugin", function () {
    it("should be able to query the blockchain using the public client", async function () {
      const client = await this.env.zksyncViem.getPublicClient();
      const blockNumber = await client.getBlockNumber();

      assert(blockNumber > 900000n);
    });

    it.skip("should be able to query the blockchain using the wallet client", async function () {
      const publicClient = await this.env.zksyncViem.getPublicClient();
      const [fromWalletClient, toWalletClient] =
        await this.env.zksyncViem.getWalletClients();
      const fromAddress = fromWalletClient.account!.address;
      const toAddress = toWalletClient.account!.address;

      const _fromBalanceBefore: bigint = await publicClient.getBalance({
        address: fromAddress,
      });
      const toBalanceBefore: bigint = await publicClient.getBalance({
        address: toAddress,
      });

      const etherAmount = parseEther("0.0001");
      const hash = await fromWalletClient.sendTransaction({
        to: toAddress,
        value: etherAmount,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const _transactionFee = receipt.gasUsed * receipt.effectiveGasPrice;

      const _fromBalanceAfter: bigint = await publicClient.getBalance({
        address: fromAddress,
      });
      const toBalanceAfter: bigint = await publicClient.getBalance({
        address: toAddress,
      });

      assert.isDefined(receipt);
      assert.equal(receipt.status, "success");
      assert.equal(toBalanceAfter, toBalanceBefore + etherAmount);
    });

    // Skipping untill Viem PR for zkSync Development chains is merged. (https://github.com/wevm/viem/pull/1864)
    it.skip("should be able to query the blockchain using the test client", async function () {
      const publicClient: PublicClient =
        await this.env.zksyncViem.getPublicClient();
      const testClient = await this.env.zksyncViem.getTestClient();
      await testClient.mine({
        blocks: 1000000,
      });
      const blockNumber = await publicClient.getBlockNumber();
      assert.ok(
        [1000000n, 1000001n].includes(blockNumber),
        `Expected blockNumber to be 1000000n or 1000001n, but got ${blockNumber}`
      );
    });

    describe.skip("should be able to query the blockchain using the public client on zksync sepolia testnet", async function () {
      it("should be able to query the blockNumber", async function () {
        const client = await this.env.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http(),
        });
        const blockNumber = await client.getBlockNumber();
        assert(blockNumber > 0, "Block number should be greater than 0");
      });

      it("should be able to query the account balance", async function () {
        const client = await this.env.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http(),
        });
        const balance = await client.getBalance({
          address: "0x0000000000000000000000000000000000000000",
        });
        assert(
          balance > 0,
          "Balance of 0x0000000000000000000000000000000000000000 should probably be > 0"
        );
      });

      it("should be able to query the block", async function () {
        const client = await this.env.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http(),
        });
        const block = await client.getBlock({ blockNumber: 1n });
        assert("hash" in block, "Block should have had a hash propery");
        assert("miner" in block, "Block should have had a miner propery");
        assert(
          "transactions" in block,
          "Block should have had a transactions propery"
        );
      });

      it("should be able to query the gas price", async function () {
        const client = await this.env.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http(),
        });
        const gasPrice = await client.getGasPrice();
        assert(gasPrice > 0, "gas price should be greater than 0");
      });

      it("should be able to query the gas price", async function () {
        const client = await this.env.zksyncViem.getPublicClient({
          chain: chains.zkSyncSepoliaTestnet,
          transport: http(),
        });
        const chainId = await client.getChainId();
        assert.equal(chainId, 300);
      });
    });
  });

  describe("Contract Deployment - Greeter", function () {
    useEnvironment("hardhat-project", "testnet");
    it("should be able to deploy greeter contract", async function () {
      const pubClient = await this.env.zksyncViem.getPublicClient({
        transport: http(),
        chain: chains.zkSyncSepoliaTestnet,
      });
      const walletClient = await this.env.zksyncViem.getWalletClient(
        "0x636A122e48079f750d44d13E5b39804227E1467e",
        {
          account: privateKeyToAccount(
            "0x11a886803cd3d49695b838f18ab9697feafd8465dc423c12eb6c3722727a4bba"
          ),
          chain: chains.zkSyncSepoliaTestnet,
          transport: http(),
        }
      );
      const contract = await this.env.zksyncViem.deployContract(
        "Greeter",
        ["Hi there!"],
        {
          client: {
            wallet: walletClient,
            public: pubClient,
          },
        }
      );
      assert((await contract.read.greet()) === "Hi there!");
      await contract.write.setGreeting(["Hello!!"]);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const greeting2 = await contract.read.greet();
      assert.equal(greeting2, "Hello!!");
    });
  });

  describe("Contract Deployment - Import", function () {
    useEnvironment("import", "testnet");

    it("should be able to deploy Import contract", async function () {
      const pubClient = await this.env.zksyncViem.getPublicClient({
        transport: http(),
        chain: chains.zkSyncSepoliaTestnet,
      });

      const walletClient = await this.env.zksyncViem.getWalletClient(
        "0x636A122e48079f750d44d13E5b39804227E1467e",
        {
          account: privateKeyToAccount(
            "0x11a886803cd3d49695b838f18ab9697feafd8465dc423c12eb6c3722727a4bba"
          ),
          chain: chains.zkSyncSepoliaTestnet,
          transport: http(),
        }
      );
      const contract = await this.env.zksyncViem.deployContract("Import", [], {
        client: {
          wallet: walletClient,
          public: pubClient,
        },
      });
      assert((await contract.read.getFooName()) === "Foo");
    });
  });

  describe("Contract Deployment - Library", function () {
    useEnvironment("library", "testnet");

    it("should be able to deploy Lib contract", async function () {
      const pubClient = await this.env.zksyncViem.getPublicClient({
        transport: http(),
        chain: chains.zkSyncSepoliaTestnet,
      });

      const walletClient = await this.env.zksyncViem.getWalletClient(
        "0x636A122e48079f750d44d13E5b39804227E1467e",
        {
          account: privateKeyToAccount(
            "0x11a886803cd3d49695b838f18ab9697feafd8465dc423c12eb6c3722727a4bba"
          ),
          chain: chains.zkSyncSepoliaTestnet,
          transport: http(),
        }
      );
      const contract = await this.env.zksyncViem.deployContract("Lib", [], {
        client: {
          wallet: walletClient,
          public: pubClient,
        },
      });
      const result = await contract.read.plus([3, 2]);
      assert(result === 1n);
    });
  });

  describe("Contract Deployment - TwoUsrMultisig", function () {
    useEnvironment("account-abstraction", "testnet");

    it("should be able to deploy account-abstraction contract", async function () {
      const pubClient = await this.env.zksyncViem.getPublicClient({
        transport: http(),
        chain: chains.zkSyncSepoliaTestnet,
      });
      const walletClient = await this.env.zksyncViem.getWalletClient(
        "0x636A122e48079f750d44d13E5b39804227E1467e",
        {
          account: privateKeyToAccount(
            "0x11a886803cd3d49695b838f18ab9697feafd8465dc423c12eb6c3722727a4bba"
          ),
          chain: chains.zkSyncSepoliaTestnet,
          transport: http(),
        }
      );
      const owner1 = WALLET_ADDRESS_1;
      const owner2 = WALLET_ADDRESS_2;

      const contract = await this.env.zksyncViem.deployContract(
        "TwoUserMultisig",
        [owner1, owner2],
        {
          client: {
            wallet: walletClient,
            public: pubClient,
          },
        }
      );
      assert.equal(await contract.read.owner1(), owner1);
      assert.equal(await contract.read.owner2(), owner2);
    });
  });

  describe.skip("Hardhat Runtime Environment extension", function () {
    it("should add the viem object and it's properties", function () {
      expect(this.env.zksyncViem)
        .to.be.an("object")
        .that.has.all.keys([
          "getPublicClient",
          "getWalletClients",
          "getWalletClient",
          "getTestClient",
          "getContractAt",
          "deployContract",
        ]);
    });
  });
});
