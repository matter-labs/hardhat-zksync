import { expect } from "chai";
import { Wallet, Provider,Contract } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import "@matterlabs/hardhat-zksync-node/dist/type-extensions";
import * as hre from "hardhat";

const RICH_PRIVATE_KEY = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe("Greeter", function () {
    let provider: Provider;
    let deployer: Deployer;
    let artifact: ZkSyncArtifact;
    let contract: Contract;

    beforeEach(async function () {
        // Deploy the contract before each test
        provider = new Provider(hre.network.config.url);
        deployer = new Deployer(hre, new Wallet(RICH_PRIVATE_KEY, provider));
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
        //Added for preveting nonce errors.
        await new Promise(resolve => setTimeout(resolve, 1000));
        await contract.setGreeting("Hello, Ethereum!");
        expect(await contract.greet()).to.equal("Hello, Ethereum!");
    });
});
