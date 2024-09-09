import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = new Wallet('0x9d81dd1aaccd4bd613a641e42728ccfa49aaf5c0eda8ce5faeb159c493894329')
    const deployer = new Deployer(hre, zkWallet);

    // deploy proxy
    const contractName = 'BoxUups';

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.upgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'initialize' });

    await box.waitForDeployment();

    // upgrade proxy implementation

    const BoxUupsV2 = await deployer.loadArtifact('BoxUupsV2');
    const upgradedBox = await hre.upgrades.upgradeProxy(deployer.zkWallet, await box.getAddress(), BoxUupsV2);
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
