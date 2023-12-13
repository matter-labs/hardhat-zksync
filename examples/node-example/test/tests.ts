import { expect } from "chai";
import { Contract, Wallet } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { ZkSyncProviderAdapter } from "@matterlabs/hardhat-zksync-node";
import * as hre from "hardhat";

describe("Greeter", function () {
    let deployer: Deployer;
    let artifact: ZkSyncArtifact;
    let contract: Contract;

    beforeEach(async function () {
        // Deploy the contract before each test
        deployer = new Deployer(hre, new Wallet('0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110', (hre.network.provider as ZkSyncProviderAdapter)._zkSyncProvider));
        artifact = await deployer.loadArtifact('Greeter');
        contract = await deployer.deploy(artifact, ['Hello, world!']);
    });

    // Test the constructor
    it("Should set the greeting to the constructor argument", async function () {
        expect(await contract.greet()).to.equal("Hello, world!");
    });

    // Test the greet() function
    it("Should return the current greeting", async function () {
        expect(await contract.greet()).to.equal("Hello, world!");
    });

    // Test the setGreeting() function
    it("Should set a new greeting", async function () {
        await contract.setGreeting("Hello, Ethereum!");
        expect(await contract.greet()).to.equal("Hello, Ethereum!");
    });
});
