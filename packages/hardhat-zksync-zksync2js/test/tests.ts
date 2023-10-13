import { assert } from 'chai';
import { useEnvironment } from './helpers';

describe('Plugin tests', async function () {

  describe('successful-compilation artifact', async function () {
    useEnvironment('simple');

    describe("HRE extensions", function () {
      it("should extend hardhat runtime environment", async function () {
        assert.isDefined(this.env.zksync2js);
        assert.containsAllKeys(this.env.zksync2js, [
          "provider",
          "getSigners",
          "getImpersonatedSigner",
          "getContractFactory",
          "getContractAt",
          "getSigner",
          "extractFactoryDeps",
          "loadArtifact",
          "deployContract"
        ]);
      });
    });

    describe("Provider", function () {
      it("the provider should handle requests", async function () {
        const blockNumber = await this.env.zksync2js.provider.send("eth_blockNumber", []);
        assert.strictEqual("0x0", blockNumber);
      });
    });

    describe("Signers and contracts helpers", function () {
      describe("getSigners", function () {
        it("should return the signers", async function () {
          const sigs = await this.env.zksync2js.getSigners();
          assert.strictEqual(
            await sigs[0].getAddress(),
            "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049"
          );
        });
        it("should expose the address synchronously", async function () {
          const sigs = await this.env.zksync2js.getSigners();
          assert.strictEqual(
            sigs[0].address,
            "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049"
          );
        });
      });
      describe("getImpersonatedSigner", function () {
        it("should return the working impersonated signer", async function () {
          const address = `0x${"ff".repeat(20)}`;
          const impersonatedSigner =
            await this.env.zksync2js.getImpersonatedSigner(address);

          assert.strictEqual(
            impersonatedSigner.address,
            "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF"
          );

        });
      });
      describe("signer", function () {
        // `signer.getBalance` is not present in ethers v6; we should re-enable
        // this test when/if it's added back
        it.skip("should return the balance of the account", async function () {
          const [sig] = await this.env.zksync2js.getSigners();
          assert.strictEqual(
            (await sig.getBalance()).toString(),
            "100000000000000000000"
          );
        });

        it("should return the balance of the account", async function () {
          // we use the second signer because the first one is used in previous tests
          const [, secondSigner] = await this.env.zksync2js.getSigners();
          assert.strictEqual(
            await this.env.zksync2js.provider.getBalance(secondSigner.address),
            1000000000000000000000000000000n
          );
        });

        it("should return the transaction count of the account", async function () {
          // we use the second signer because the first one is used in previous tests
          const [, secondSigner] = await this.env.zksync2js.getSigners();
          assert.strictEqual(
            await this.env.zksync2js.provider.getTransactionCount(secondSigner),
            0
          );
        });

        it("should deploy with signer", async function () {
          const [signer] = await this.env.zksync2js.getSigners();

          const artifact = await this.env.zksync2js.loadArtifact("Greeter");
          const contract =  await this.env.zksync2js.deployContract(artifact, []);
          assert.isDefined(contract);
          assert.equal(contract.address.length, 42);
        });
      });
    });
  });
});
