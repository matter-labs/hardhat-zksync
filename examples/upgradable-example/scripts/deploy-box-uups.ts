import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-web3';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const contractName = 'BoxUups';
    console.info(chalk.yellow('Deploying ' + contractName + '...'));

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");

    const deployer = new Deployer(hre, zkWallet);

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'initialize' });

    await box.deployed();

    box.connect(zkWallet);
    const value = await box.retrieve();
    console.info(chalk.cyan('Box value is: ', value.toNumber()));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
