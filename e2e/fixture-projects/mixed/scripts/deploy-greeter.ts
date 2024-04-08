import * as zk from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import * as hre from 'hardhat';
import { Wallet, Provider } from "zksync-ethers";

async function main() {
    console.info(`Running deploy script for the Greeter contract`);

    const TEST_PRIVATE_KEY = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
    const provider = new Provider("http://localhost:8011",undefined,{cacheTimeout:-1})
    const zkWallet = new Wallet(TEST_PRIVATE_KEY,provider);

    const deployer = new Deployer(hre, zkWallet);

    const artifact = await deployer.loadArtifact('Greeter');

    const greeting = 'Hi there!';
    const greeterContract = await deployer.deploy(artifact, [greeting]);

    await greeterContract.deployed();

    const contractAddress = greeterContract.address;
    console.info(`${artifact.contractName} was deployed to ${contractAddress}!`);

    const greetingFromContract = await greeterContract.greet();
    if (greetingFromContract == greeting) {
        console.info(`Successful greeting from the contract`);
    } else {
        throw new Error(`Contract returned unexpected greeting: ${greetingFromContract}`);
    }
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
