import { loadArtifacts, loadJsonFiles } from "../src/artifacts";
import * as path from "path";

import { useEnvironment, artifactsFolder } from "./helpers";


describe("Helper functionality", async function () {
    it("Should load JSON files", async function () {
        // useEnvironment("successful-compilation");
        const folder = artifactsFolder("successful-compilation");
        console.log(`Folder is ${folder}`);
        const files = await loadJsonFiles(folder);

        console.log(`Files: ${files}`);
    })

    it("Should load artifacts", async function () {
        
    })

})