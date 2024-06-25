const chalk = require('chalk');

// An example of a deploy script which will deploy and call a simple contract.
var deployScript = async function (hre) {
    console.info(chalk.yellow(`Running deploy script for the Greeter contract`));

    // Load the artifact we want to deploy.
    const artifact = await deployer.loadArtifact('Greeter');

    // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    // `greeting` is an argument for contract constructor.
    const greeting = 'Hi there!';
    const greeterContract = await hre.deployer.deploy(artifact, [greeting]);

    // Show the contract info.
    const contractAddress = await greeterContract.getAddress();
    console.info(chalk.green(`${artifact.contractName} was deployed to ${contractAddress}!`));

    // Call the deployed contract.
    const greetingFromContract = await greeterContract.greet();
    if (greetingFromContract == greeting) {
        console.info(chalk.green(`Successful greeting from the contract`));
    } else {
        throw new Error(`Contract returned unexpected greeting: ${greetingFromContract}`);
    }
};

module.exports["default"] = deployScript;
deployScript.priority = 1500;
