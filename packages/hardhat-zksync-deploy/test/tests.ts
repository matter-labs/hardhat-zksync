import { useEnvironment } from "./helpers";
import { assert } from "chai";


describe("Plugin tests", async function () {
    describe("successful-compilation artifact", async function () {
        useEnvironment("successful-compilation");

        it("Should load artifacts", async function () {
            const artifactExists = await this.env.artifacts.artifactExists("Greeter");
            assert(artifactExists, "Greeter artifact doesn't exist");

            const artifact = await this.env.artifacts.readArtifact("Greeter");
            assert(artifact._format == "hh-zksolc-artifact-1", "Incorrect artifact build");

            // Check that we can load an additional key (it turns that we can which is great).
            assert((artifact as any)["_additionalKey"] == "some_value", "Additional key not loaded!");
        })
    })
})
