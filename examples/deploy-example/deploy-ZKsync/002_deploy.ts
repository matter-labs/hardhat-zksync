import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';

const deployScript = async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy script for the Constant contract`));

    // Load the artifact we want to deploy.
    const artifact = await hre.deployer.loadArtifact('Constant');

    // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    // This contract has no constructor arguments.
    const factoryContract = await hre.deployer.deploy(artifact, [], 'create2', {
        customData: {
            salt: '0x7935910912126667836566922594852029127629416664760357073852948630',
        },
    });

    // Show the contract info.
    const contractAddress = await factoryContract.getAddress();
    console.info(chalk.green(`${artifact.contractName} was deployed to ${contractAddress}!`));
};

export default deployScript;

deployScript.tags = ['first'];
