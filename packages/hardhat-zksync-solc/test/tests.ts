import { assert } from "chai";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { ZkSyncArtifact } from "../src/types";

import { useEnvironment } from "./helpers";

describe("zksolc plugin", async function () {
  describe("Successful compilation", async function () {
    useEnvironment("successful-compilation");

    it("Should successfully compile the simple contract", async function () {
      await this.env.run(TASK_COMPILE);

      const artifact = this.env.artifacts.readArtifactSync("Greeter") as ZkSyncArtifact;

      assert.equal(
        artifact.contractName,
        "Greeter"
      );

      // Check that zkSync-specific artifact information was added.
      assert.deepEqual(artifact.factoryDeps, {"a": "b"}, "Factory deps info was not added");
      assert.equal(artifact.sourceMapping, "", "Source mapping info was not added");
    });
  });

  describe("Multi-file", async function () {
    useEnvironment("multi-file");

    it("Should successfully compile the multi-file contracts", async function () {
      await this.env.run(TASK_COMPILE);
      assert.equal(
        this.env.artifacts.readArtifactSync("Foo").contractName,
        "Foo"
      );
      assert.equal(
        this.env.artifacts.readArtifactSync("Import").contractName,
        "Import"
      );
    });
  });

  describe("Nested", async function () {
    useEnvironment("nested");

    it("Should successfully compile nested contracts", async function () {
      await this.env.run(TASK_COMPILE);
      assert.equal(
        this.env.artifacts.readArtifactSync("Foo").contractName,
        "Foo"
      );
      assert.equal(
        this.env.artifacts.readArtifactSync("Bar").contractName,
        "Foo"
      );
      assert.equal(
        this.env.artifacts.readArtifactSync("Import").contractName,
        "Import"
      );
    });
  });

  describe("Factory", async function () {
    useEnvironment("factory");

    it("Should successfully compile the factory contract", async function () {
      await this.env.run(TASK_COMPILE);
      assert.equal(
        this.env.artifacts.readArtifactSync("contracts/Factory.sol:Factory")
          .contractName,
        "Factory"
      );
      assert.equal(
        this.env.artifacts.readArtifactSync("contracts/Factory.sol:Dep")
          .contractName,
        "Dep"
      );
    });
  });
});
