import * as ethers from 'ethers';
import * as zk from 'zksync-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import chalk from 'chalk';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow('Running deploy script for the Account Abstraction'));

    // It's crucial to avoid hardcoding sensitive information. Use environment variables instead.
    const testMnemonic = process.env.MNEMONIC || ''; // Use an environment variable for the mnemonic
    if (!testMnemonic) throw new Error('MNEMONIC is not set in the environment variables.');

    const zkWallet = zk.Wallet.fromMnemonic(testMnemonic);

    // Instantiate deployer objects and load artifacts.
    const contractDeployer = new Deployer(hre, zkWallet, 'create');
    const aaDeployer = new Deployer(hre, zkWallet, 'createAccount');
    const greeterArtifact = await contractDeployer.loadArtifact('Greeter');
    const aaArtifact = await aaDeployer.loadArtifact('TwoUserMultisig');

    // Make sure to handle the provider's connection and network status.
    const provider = aaDeployer.zkWallet.provider;
    if (!provider) throw new Error('Failed to get a provider from the zkSync wallet.');

    // Perform a deposit to L2 to enable transactions.
    console.info(chalk.blue('Depositing funds to L2...'));
    const depositAmount = ethers.utils.parseEther('0.001'); // Adjust the deposit amount as needed.
    const depositHandle = await contractDeployer.zkWallet.deposit({
        to: await contractDeployer.zkWallet.getAddress(),
        token: zk.utils.ETH_ADDRESS,
        amount: depositAmount,
    });
    await depositHandle.wait();
    console.info(chalk.green(`Deposit of ${depositAmount.toString()} ETH completed.`));

    // Deploy contracts with error handling.
    try {
        const greeterContract = await contractDeployer.deploy(greeterArtifact, ['Hi there!']);
        console.info(chalk.green(`Greeter was deployed to ${await greeterContract.getAddress()}`));

        // Initialize multisig with two randomly generated owners.
        const owner1 = zk.Wallet.createRandom();
        const owner2 = zk.Wallet.createRandom();
        const aa = await aaDeployer.deploy(aaArtifact, [owner1.address, owner2.address], undefined, []);
        const multisigAddress = await aa.getAddress();
        console.info(chalk.green(`Multisig was deployed to ${multisigAddress}`));

        // Fund the multisig with a specified amount of ETH.
        const multisigFundAmount = ethers.utils.parseEther('0.003'); // Adjust funding amount as needed.
        await (await contractDeployer.zkWallet.sendTransaction({
            to: multisigAddress,
            value: multisigFundAmount,
        })).wait();
        console.info(chalk.green(`Multisig funded with ${multisigFundAmount.toString()} ETH.`));

        // Example of executing a transaction from the multisig.
        // This section could be expanded with more complex logic as needed.
        const newGreeting = 'Hello!';
        // Further implementation would go here.
    } catch (error) {
        console.error(chalk.red(`An error occurred during the deployment process: ${error.message}`));
    }
}

