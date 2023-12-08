import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);
    const deployer = new Deployer(hre, zkWallet);
    // deploy proxy
    const contractName = 'Box';

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'store' });

    await box.waitForDeployment();

    // upgrade proxy implementation

    const BoxV2 = await deployer.loadArtifact('BoxV2');
    const upgradedBox = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, await box.getAddress(), BoxV2);
    console.info(chalk.green('Successfully upgraded Box to BoxV2'));

    upgradedBox.connect(zkWallet);
    // wait some time before the next call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const value = await upgradedBox.retrieve();
    console.info(chalk.cyan('Box value is', value));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
