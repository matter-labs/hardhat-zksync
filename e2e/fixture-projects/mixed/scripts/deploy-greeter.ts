import * as zk from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import * as hre from 'hardhat';

async function main() {
    console.info(`Running deploy script for the Greeter contract`);

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const provider = new zk.Provider("http://localhost:8011",undefined,{cacheTimeout:-1})
    const zkWallet = zk.Wallet.fromMnemonic(testMnemonic,provider);

    const deployer = new Deployer(hre, zkWallet);

    const artifact = await deployer.loadArtifact('Greeter');

    const greeting = 'Hi there!';
    const greeterContract = await deployer.deploy(artifact, [greeting]);

    const contractAddress = await greeterContract.getAddress();
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
