import { assert } from "chai";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

import { useEnvironment } from "./helpers";

describe("zksolc plugin", async function () {
  describe("Successful compilation", async function () {
    useEnvironment("successful-compilation");

    it("Should successfully compile the contract", async function () {
      await this.env.run(TASK_COMPILE);
      assert.equal(
        this.env.artifacts.readArtifactSync("Greeter").contractName,
        "Greeter"
      );
    });
  });
  
  describe("Multi-file", async function () {
    useEnvironment("multi-file");

    it("Should successfully compile the contracts", async function () {
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

    it("Should successfully compile the contracts", async function () {
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
});
