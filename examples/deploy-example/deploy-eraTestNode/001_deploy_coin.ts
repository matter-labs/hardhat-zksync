import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';

// An example of a deploy script which will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy script for the Test contract`));

    const testCoin =  await hre.deployer.deploy("TestCoin");

    const contractAddress = await testCoin.getAddress();
    console.info(chalk.green(`TestCoin was deployed to ${contractAddress}!`));
}
