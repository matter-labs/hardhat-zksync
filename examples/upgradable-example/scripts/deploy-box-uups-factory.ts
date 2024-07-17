import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { ContractFactory, Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const contractName = 'BoxUups';
    console.info(chalk.yellow(`Deploying ${contractName}...`));

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);

    const deployer = new Deployer(hre, zkWallet);

    const boxUupsArtifact = await hre.deployer.loadArtifact(contractName);
    const boxUupsFactory = new ContractFactory(boxUupsArtifact.abi, boxUupsArtifact.bytecode, deployer.zkWallet);

    const boxUups = await hre.zkUpgrades.deployProxy(boxUupsFactory, [42], { initializer: 'initialize' });

    await boxUups.deployed();

    boxUups.connect(zkWallet);
    const value = await boxUups.retrieve();
    console.info(chalk.cyan('Box value is: ', value));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
