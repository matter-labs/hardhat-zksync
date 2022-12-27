const ethers = require('ethers');
const zk = require('zksync-web3');
const { Deployer } = require('@matterlabs/hardhat-zksync-deploy');
const chalk = require('chalk');

// An example of a deploy script which will deploy and call a simple contract.
module.exports = async function (hre) {
    console.info(chalk.yellow(`Running deploy script for the Greeter contract`));

    // Initialize an Ethereum wallet.
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = zk.Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");

    // Create deployer object and load desired artifact.
    const deployer = new Deployer(hre, zkWallet);

    // Deposit some funds to L2 in order to be able to perform deposits.
    const depositHandle = await deployer.zkWallet.deposit({
        to: deployer.zkWallet.address,
        token: zk.utils.ETH_ADDRESS,
        amount: ethers.utils.parseEther('0.001'),
    });
    await depositHandle.wait();

    // Load the artifact we want to deploy.
    const artifact = await deployer.loadArtifact('Greeter');

    // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    // `greeting` is an argument for contract constructor.
    const greeting = 'Hi there!';
    const greeterContract = await deployer.deploy(artifact, [greeting]);

    // Show the contract info.
    const contractAddress = greeterContract.address;
    console.info(chalk.green(`${artifact.contractName} was deployed to ${contractAddress}!`));

    // Call the deployed contract.
    const greetingFromContract = await greeterContract.greet();
    if (greetingFromContract == greeting) {
        console.info(chalk.green(`Successful greeting from the contract`));
    } else {
        throw new Error(`Contract returned unexpected greeting: ${greetingFromContract}`);
    }
};
