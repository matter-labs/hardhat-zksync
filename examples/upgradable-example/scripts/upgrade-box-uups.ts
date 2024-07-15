import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);
    const deployer = new Deployer(hre, zkWallet);

    // deploy proxy
    const contractName = 'BoxUups';

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(contract, deployer.zkWallet, [42], { initializer: 'initialize' });

    await box.waitForDeployment();

    // upgrade proxy implementation

    const BoxUupsV2 = await deployer.loadArtifact('BoxUupsV2');
    const upgradedBox = await hre.zkUpgrades.upgradeProxy(await box.getAddress(), BoxUupsV2, deployer.zkWallet);
    console.info(chalk.green('Successfully upgraded BoxUups to BoxUupsV2'));

    upgradedBox.connect(zkWallet);
    // wait some time before the next call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const value = await upgradedBox.retrieve();
    console.info(chalk.cyan('BoxUups value is', value));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
