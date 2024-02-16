require('dotenv').config();
const ethers = require('ethers');
const zk = require('zksync-ethers');
const { Deployer } = require('@matterlabs/hardhat-zksync-deploy');
const chalk = require('chalk');

// Load sensitive information and configuration from environment variables
const MNEMONIC = process.env.MNEMONIC;
const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT || '0.001'; // Default to 0.001 ETH if not set

module.exports = async function (hre) {
    console.info(chalk.yellow(`Running deploy script for the Greeter contract`));

    if (!MNEMONIC) {
        console.error(chalk.red('Mnemonic is not provided. Please set the MNEMONIC environment variable.'));
        process.exit(1);
    }

    // Initialize an Ethereum wallet using the mnemonic from the environment variable
    const zkWallet = zk.Wallet.fromMnemonic(MNEMONIC);

    // Create deployer object and load desired artifact
    const deployer = new Deployer(hre, zkWallet);

    try {
        // Deposit some funds to L2 to enable transactions
        console.info(chalk.blue('Depositing funds to L2...'));
        const depositHandle = await deployer.zkWallet.deposit({
            to: zkWallet.address,
            token: zk.utils.ETH_ADDRESS,
            amount: ethers.utils.parseEther(DEPOSIT_AMOUNT),
        });
        await depositHandle.wait();
        console.info(chalk.green(`Deposit of ${DEPOSIT_AMOUNT} ETH completed.`));

        // Load the artifact for the Greeter contract and deploy it
        const artifact = await deployer.loadArtifact('Greeter');
        const greeting = 'Hi there!';
        const greeterContract = await deployer.deploy(artifact, [greeting]);

        // Show the contract info after successful deployment
        const contractAddress = await greeterContract.getAddress();
        console.info(chalk.green(`${artifact.contractName} was deployed to ${contractAddress}!`));

        // Interact with the deployed contract and check the greeting
        const greetingFromContract = await greeterContract.greet();
        if (greetingFromContract === greeting) {
            console.info(chalk.green('Successful greeting from the contract'));
        } else {
            throw new Error(`Contract returned unexpected greeting: ${greetingFromContract}`);
        }
    } catch (error) {
        console.error(chalk.red(`Deployment failed: ${error.message}`));
        process.exit(1);
    }
};

