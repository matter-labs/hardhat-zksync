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

    const boxFactory = await hre.zksyncEthers.getContractFactory(contractName, deployer.zkWallet);
    const box = await hre.upgrades.deployProxy(boxFactory, [42], { initializer: 'store' });

    await box.waitForDeployment();

    // upgrade proxy implementation

    const boxV2Factory = await hre.zksyncEthers.getContractFactory('BoxV2',deployer.zkWallet);
    const upgradedBox = await hre.upgrades.upgradeProxy(await box.getAddress(), boxV2Factory);
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
