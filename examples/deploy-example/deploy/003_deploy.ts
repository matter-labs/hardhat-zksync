import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';

const deployScript = async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy script for the Constant contract from deploy folder`));

    // Load the artifact we want to deploy.

    // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    // This contract has no constructor arguments.
    const factoryContract = await hre.deployer.deploy('Constant');

    // Show the contract info.
    const contractAddress = await factoryContract.getAddress();
    console.info(chalk.green(`Constant was deployed to ${contractAddress}!`));
};

export default deployScript;

deployScript.tags = ['first'];
