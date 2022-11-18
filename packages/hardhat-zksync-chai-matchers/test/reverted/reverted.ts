import { AssertionError, expect } from "chai";
import { ProviderError } from "hardhat/internal/core/providers/errors";
import * as zk from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy/src/deployer";
import path from "path";
import util from "util";

import {
  runSuccessfulAsserts,
  runFailedAsserts,
  useEnvironmentWithLocalSetup
} from "../helpers";

import "../../src/internal/add-chai-matchers";
import { RECOMMENDED_GAS_LIMIT } from "zksync-web3/build/src/utils";

const RICH_WALLET_PK = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";

describe("INTEGRATION: Reverted", function () {
  let matchers: zk.Contract;
  let provider: zk.Provider;
  let wallet: zk.Wallet;
  let deployer: Deployer;

  describe("with the in-process hardhat network", function () {
    useEnvironmentWithLocalSetup("hardhat-project");

    runTests();
  });

  function runTests() {
    // deploy Matchers contract before each test
    beforeEach("deploy matchers contract", async function () {
      provider = new zk.Provider(this.hre.config.zkSyncDeploy.zkSyncNetwork);
      wallet = new zk.Wallet(RICH_WALLET_PK, provider);
      deployer = new Deployer(this.hre, wallet);

      const artifact = await deployer.loadArtifact("Matchers");
      matchers = await deployer.deploy(artifact);
    });

    // helpers
    const expectAssertionError = async (x: Promise<void>, message: string) => {
      return expect(x).to.be.eventually.rejectedWith(AssertionError, message);
    };

    // const mineSuccessfulTransaction = async (hre: any) => {
    //   await hre.network.provider.send("evm_setAutomine", [false]);

    //   const [signer] = await hre.ethers.getSigners();
    //   const tx = await signer.sendTransaction({ to: signer.address });

    //   await hre.network.provider.send("hardhat_mine", []);
    //   await hre.network.provider.send("evm_setAutomine", [true]);

    //   return tx;
    // };

    // const mineRevertedTransaction = async (hre: any) => {
    //   await hre.network.provider.send("evm_setAutomine", [false]);

    //   const tx = await matchers.revertsWithoutReason({
    //     gasLimit: 1_000_000,
    //   });

    //   await hre.network.provider.send("hardhat_mine", []);
    //   await hre.network.provider.send("evm_setAutomine", [true]);

    //   return tx;
    // };

    describe("with a string as its subject", function () {
      // it("hash of a successful transaction", async function () {
      //   const { hash } = await mineSuccessfulTransaction(this.hre);

      //   await expectAssertionError(
      //     expect(hash).to.be.reverted,
      //     "Expected transaction to be reverted"
      //   );
      //   await expect(hash).to.not.be.reverted;
      // });

      // it("hash of a reverted transaction", async function () {
      //   const { hash } = await mineRevertedTransaction(this.hre);

      //   await expect(hash).to.be.reverted;
      //   await expectAssertionError(
      //     expect(hash).to.not.be.reverted,
      //     "Expected transaction NOT to be reverted"
      //   );
      // });

      it("invalid string", async function () {
        await expect(expect("0x123").to.be.reverted).to.be.rejectedWith(
          TypeError,
          "Expected a valid transaction hash, but got '0x123'"
        );

        await expect(expect("0x123").to.not.be.reverted).to.be.rejectedWith(
          TypeError,
          "Expected a valid transaction hash, but got '0x123'"
        );
      });

      // it("promise of a hash of a successful transaction", async function () {
      //   const { hash } = await mineSuccessfulTransaction(this.hre);

      //   await expectAssertionError(
      //     expect(Promise.resolve(hash)).to.be.reverted,
      //     "Expected transaction to be reverted"
      //   );
      //   await expect(Promise.resolve(hash)).to.not.be.reverted;
      // });

      // it("promise of a hash of a reverted transaction", async function () {
      //   const { hash } = await mineRevertedTransaction(this.hre);

      //   await expect(Promise.resolve(hash)).to.be.reverted;
      //   await expectAssertionError(
      //     expect(Promise.resolve(hash)).to.not.be.reverted,
      //     "Expected transaction NOT to be reverted"
      //   );
      // });

      it("promise of an invalid string", async function () {
        await expect(
          expect(Promise.resolve("0x123")).to.be.reverted
        ).to.be.rejectedWith(
          TypeError,
          "Expected a valid transaction hash, but got '0x123'"
        );

        await expect(
          expect(Promise.resolve("0x123")).to.not.be.reverted
        ).to.be.rejectedWith(
          TypeError,
          "Expected a valid transaction hash, but got '0x123'"
        );
      });
    });

    describe("with a TxResponse as its subject", function () {
      // it("TxResponse of a successful transaction", async function () {
      //   const tx = await mineSuccessfulTransaction(this.hre);

      //   await expectAssertionError(
      //     expect(tx).to.be.reverted,
      //     "Expected transaction to be reverted"
      //   );
      //   await expect(tx).to.not.be.reverted;
      // });

      // it("TxResponse of a reverted transaction", async function () {
      //   const tx = await mineRevertedTransaction(this.hre);

      //   await expect(tx).to.be.reverted;
      //   await expectAssertionError(
      //     expect(tx).to.not.be.reverted,
      //     "Expected transaction NOT to be reverted"
      //   );
      // });

      // it("promise of a TxResponse of a successful transaction", async function () {
      //   const txPromise = mineSuccessfulTransaction(this.hre);

      //   await expectAssertionError(
      //     expect(txPromise).to.be.reverted,
      //     "Expected transaction to be reverted"
      //   );
      //   await expect(txPromise).to.not.be.reverted;
      // });

      // it("promise of a TxResponse of a reverted transaction", async function () {
      //   const txPromise = mineRevertedTransaction(this.hre);

      //   await expect(txPromise).to.be.reverted;
      //   await expectAssertionError(
      //     expect(txPromise).to.not.be.reverted,
      //     "Expected transaction NOT to be reverted"
      //   );
      // });
    });

    describe("with a TxReceipt as its subject", function () {
      // it("TxReceipt of a successful transaction", async function () {
      //   const tx = await mineSuccessfulTransaction(this.hre);
      //   const receipt = await tx.wait();

      //   await expectAssertionError(
      //     expect(receipt).to.be.reverted,
      //     "Expected transaction to be reverted"
      //   );
      //   await expect(receipt).to.not.be.reverted;
      // });

      // it("TxReceipt of a reverted transaction", async function () {
      //   const tx = await mineRevertedTransaction(this.hre);
      //   const receipt = await this.hre.ethers.provider.waitForTransaction(
      //     tx.hash
      //   ); // tx.wait rejects, so we use provider.waitForTransaction

      //   await expect(receipt).to.be.reverted;
      //   await expectAssertionError(
      //     expect(receipt).to.not.be.reverted,
      //     "Expected transaction NOT to be reverted"
      //   );
      // });

      // it("promise of a TxReceipt of a successful transaction", async function () {
      //   const tx = await mineSuccessfulTransaction(this.hre);
      //   const receiptPromise = tx.wait();

      //   await expectAssertionError(
      //     expect(receiptPromise).to.be.reverted,
      //     "Expected transaction to be reverted"
      //   );
      //   await expect(receiptPromise).to.not.be.reverted;
      // });

      // it("promise of a TxReceipt of a reverted transaction", async function () {
      //   const tx = await mineRevertedTransaction(this.hre);
      //   const receiptPromise = this.hre.ethers.provider.waitForTransaction(
      //     tx.hash
      //   ); // tx.wait rejects, so we use provider.waitForTransaction

      //   await expect(receiptPromise).to.be.reverted;
      //   await expectAssertionError(
      //     expect(receiptPromise).to.not.be.reverted,
      //     "Expected transaction NOT to be reverted"
      //   );
      // });
    });

    describe("calling a contract method that succeeds", function () {
      it("successful asserts", async function () {
        await runSuccessfulAsserts({
          matchers,
          method: "succeeds",
          args: [],
          successfulAssert: (x) => expect(x).to.not.be.reverted,
        });
      });

      it("failed asserts", async function () {
        await runFailedAsserts({
          matchers,
          method: "succeeds",
          args: [],
          failedAssert: (x) => expect(x).to.be.reverted,
          failedAssertReason: "Expected transaction to be reverted",
        });
      });
    });

    describe("calling a method that reverts with a reason string", function () {
      it("successful asserts", async function () {
        // const gasLimit = await matchers.estimateGas.revertsWith("some reason");    revertsWithoutReasonView
        // const tx = await matchers.populateTransaction.succeedsView();
        // const gasPrice = await provider.getGasPrice();
        // const gasLimit = await provider.estimateGas(tx);    
        
        // const gasLimit2 = await matchers.estimateGas.succeedsView();

        // const tx = await matchers.populateTransaction.revertsWithoutReasonView();
        // tx['customData'] = { ergsPerPubdata: zk.utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT, }

        // const gasPrice = await provider.getGasPrice();
        // const gasLimit = await provider.estimateGas(zk.Provider.hexlifyTransaction(tx));    
        
        // const gasLimit2 = await matchers.estimateGas.revertsWithoutReasonView();
        // const tx = await matchers.populateTransaction.revertsWithView("some reason");
        // const gasPrice = await provider.getGasPrice();
        // const gasLimit = await provider.estimateGas(tx);
        // const gasLimit = await matchers.estimateGas.revertsWith("some reason");
        // const fee = gasPrice.mul(gasLimit);
        // const gasLimit = RECOMMENDED_GAS_LIMIT.EXECUTE;

        // await expect(wallet.sendTransaction({
        //   ...tx,
        //   gasLimit
        // })).to.be.reverted;

        // const txResponse = await wallet.sendTransaction({
        //   ...tx,
        //   gasLimit
        // });

        // const txReceipt = await txResponse.wait();

        // await expect(matchers.revertsWithView("some reason", { gasLimit })).to.be.reverted;

        // await matchers.revertsWith
        // await matchers.revertsWith("some reason");
        // await matchers["revertsWith"]("some reason", {gasLimit});
        // await matchers["revertsWithView"]("some reason", {gasLimit});
        // expect(await matchers.revertsWith("some reason", {gasLimit}));
        // await matchers["revertsWith"]("some reason", {gasLimit})
        await runSuccessfulAsserts({
          matchers,
          method: "revertsWith",
          args: ["some reason"],
          successfulAssert: (x) => expect(x).to.be.reverted,
        });
      });

      it("failed asserts", async function () {
        await runFailedAsserts({
          matchers,
          method: "revertsWith",
          args: ["some reason"],
          failedAssert: (x) => expect(x).not.to.be.reverted,
          failedAssertReason:
            "Expected transaction NOT to be reverted",
        });
      });
    });

    describe("calling a method that reverts with a panic code", function () {
      it("successful asserts", async function () {
        await runSuccessfulAsserts({
          matchers,
          method: "panicAssert",
          args: [],
          successfulAssert: (x) => expect(x).to.be.reverted,
        });
      });

      it("failed asserts", async function () {
        await runFailedAsserts({
          matchers,
          method: "panicAssert",
          args: [],
          failedAssert: (x) => expect(x).not.to.be.reverted,
          failedAssertReason:
            "Expected transaction NOT to be reverted",
        });
      });
    });

    describe("calling a method that reverts with a custom error", function () {
      it("successful asserts", async function () {
        await runSuccessfulAsserts({
          matchers,
          method: "revertWithSomeCustomError",
          args: [],
          successfulAssert: (x) => expect(x).to.be.reverted,
        });
      });

      it("failed asserts", async function () {
        await runFailedAsserts({
          matchers,
          method: "revertWithSomeCustomError",
          args: [],
          failedAssert: (x) => expect(x).not.to.be.reverted,
          failedAssertReason: "Expected transaction NOT to be reverted",
        });
      });
    });

    describe("invalid rejection values", function () {
      it("non-errors", async function () {
        await expectAssertionError(
          expect(Promise.reject({})).to.be.reverted,
          "Expected an Error object"
        );
      });

      it("errors that are not related to a reverted transaction", async function () {
        // use an address that almost surely doesn't have balance
        const signer = zk.Wallet.createRandom().connect(provider);

        // this transaction will fail because of lack of funds, not because of a
        // revert
        await expect(
          expect(
            matchers.connect(signer).revertsWithoutReason({
              gasLimit: 1_000_000,
            })
          ).to.not.be.revertedWithCustomError(matchers, "SomeCustomError")
        ).to.be.eventually.rejectedWith(
          Error,
          "Failed to submit transaction: Not enough balance to cover the fee."
        );
      });
    });

    describe("stack traces", function () {
      // smoke test for stack traces
      it("includes test file", async function () {
        try {
          await expect(matchers.succeeds()).to.be.reverted;
        } catch (e: any) {
          expect(util.inspect(e)).to.include(
            path.join("test", "reverted", "reverted.ts")
          );

          return;
        }

        expect.fail("Expected an exception but none was thrown");
      });
    });
  }
});
