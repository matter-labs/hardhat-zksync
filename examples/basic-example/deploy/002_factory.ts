import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as ethers from 'ethers';
import * as zk from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import chalk from 'chalk';

// An example of a deploy script which will deploy and call a factory-like contract (meaning that the main contract
// may deploy other contracts).
//
// In terms of presentation it's mostly copied from `001_deploy.ts`, so this example acts more like an integration test
// for plugins/server capabilities.
export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy script for the Factory contract`));
    // Initialize an Ethereum wallet.
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = zk.Wallet.fromMnemonic(testMnemonic);

    // Create deployer object and load desired artifact.
    const deployer = new Deployer(hre, zkWallet);

    // Deposit some funds to L2 in order to be able to perform deposits.
    const depositHandle = await deployer.zkWallet.deposit({
        to: deployer.zkWallet.address,
        token: zk.utils.ETH_ADDRESS,
        amount: ethers.parseEther('0.01'),
    });
    await depositHandle.wait();

    // Load the artifact we want to deploy.
    const artifact = await deployer.loadArtifact('Import');

    // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    // This contract has no constructor arguments.
    const factoryContract = await deployer.deploy(artifact, []);

    // Show the contract info.
    const contractAddress = await factoryContract.getAddress();
    console.info(chalk.green(`${artifact.contractName} was deployed to ${contractAddress}!`));

    // Call the deployed contract.
    const greetingFromContract = await factoryContract.getFooName();
    if (greetingFromContract == 'Foo') {
        console.info(chalk.green(`Successful greeting from the contract!`));
    } else {
        throw new Error(`Contract returned unexpected greeting: ${greetingFromContract}`);
    }
}
