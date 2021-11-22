import { useEnvironment } from "./helpers";
import { assert } from "chai";


describe("Helper functionality", async function () {
    describe("successful-compilation artifact", async function () {
        useEnvironment("successful-compilation");

        it("Should load artifacts", async function () {
            // console.log(`Artifacts: ${JSON.stringify(this.env.artifacts)}`);
            const artifactExists = await this.env.artifacts.artifactExists("Greeter");
            assert(artifactExists, "Greeter artifact doesn't exist");
        })
    })
})
