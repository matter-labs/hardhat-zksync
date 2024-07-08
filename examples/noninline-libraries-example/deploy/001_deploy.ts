import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import chalk from 'chalk';

// An example of a deploy script which will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
    await hre.zksyncEthers.deployLibraries();
    
    console.info(chalk.yellow(`Running deploy script for the Test contract`));

    // Create zkWallet object
    const zkWallet = new zk.Wallet('0x9d81dd1aaccd4bd613a641e42728ccfa49aaf5c0eda8ce5faeb159c493894329');

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
}
