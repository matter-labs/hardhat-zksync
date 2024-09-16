import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const contractName = 'BoxUups';

    const contract = await hre.ethers.getContractFactory(contractName);
    const box = await hre.upgrades.deployProxy(contract, [42], { initializer: 'initialize' });
    console.info(chalk.green(`Deployed BoxUups to ${box.address}`));

    await box.deployed();

    const BoxUupsV2 = await hre.ethers.getContractFactory('BoxUupsV2');
    await hre.upgrades.upgradeProxy(box.address, BoxUupsV2);
    console.info(chalk.green('Successfully upgraded BoxUups to BoxUupsV2'));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
