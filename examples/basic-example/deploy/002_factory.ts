import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as ethers from 'ethers';
import * as zk from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import chalk from 'chalk';

// Utilize environment variables for sensitive information like mnemonics
const MNEMONIC = process.env.MNEMONIC || '';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy script for the Factory contract`));

    if (!MNEMONIC) {
        console.error(chalk.red(`Mnemonic is not provided. Set the MNEMONIC environment variable.`));
        process.exit(1); // Exit the script with an error code
    }

    // Initialize an Ethereum wallet securely
    const zkWallet = zk.Wallet.fromMnemonic(MNEMONIC);

    // Create deployer object and load desired artifact.
    const deployer = new Deployer(hre, zkWallet);

    console.info(chalk.blue(`Depositing funds to L2 to enable transactions...`));
    // Improved readability for deposit amount
    const depositAmount = ethers.utils.parseEther('0.01');
    const depositHandle = await deployer.zkWallet.deposit({
        to: zkWallet.address,
        token: zk.utils.ETH_ADDRESS,
        amount: depositAmount,
    });
    await depositHandle.wait();
    console.info(chalk.green(`Deposit of ${depositAmount} ETH completed.`));

    // Load the artifact for deployment.
    const artifactName = 'Import'; // Consider extracting specific names and parameters to constants or environment variables for easier modifications
    const artifact = await deployer.loadArtifact(artifactName);

    // Deploy the contract and log the address
    const factoryContract = await deployer.deploy(artifact, []);
    const contractAddress = await factoryContract.getAddress();
    console.info(chalk.green(`${artifact.contractName} was deployed to ${contractAddress}!`));

    // Demonstrating contract interaction with error handling
    try {
        const greetingFromContract = await factoryContract.getFooName();
        if (greetingFromContract === 'Foo') {
            console.info(chalk.green(`Successful greeting from the contract!`));
        } else {
            throw new Error(`Contract returned unexpected greeting: ${greetingFromContract}`);
        }
    } catch (error) {
        console.error(chalk.red(`Error during contract interaction: ${error.message}`));
    }
}

