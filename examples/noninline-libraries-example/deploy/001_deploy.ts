import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import chalk from 'chalk';

// An example of a deploy script which will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy script for the Test contract`));

    // Create zkWallet object
    const zkWallet = new zk.Wallet("0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110");

    // // Create deployer object and load desired artifact.
    const deployer = new Deployer(hre, zkWallet);

    // Load the artifact we want to deploy.
    const artifact = await deployer.loadArtifact('TestCoin');

    // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    // `greeting` is an argument for contract constructor.
    const greeterContract = await deployer.deploy(artifact, []);

    // Show the contract info.
    const contractAddress = await greeterContract.getAddress();
    console.info(chalk.green(`${artifact.contractName} was deployed to ${contractAddress}!`));
};