import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const Box = await hre.ethers.getContractFactory('Box');
    const box = await hre.upgrades.deployProxy(Box, [42], { initializer: 'store' });

    await box.deployed();
    console.info(chalk.green(`Deployed Box to ${box.address}`));

    // upgrade proxy implementation

    const BoxV2 = await hre.ethers.getContractFactory('BoxV2');
    await hre.upgrades.upgradeProxy(box.address, BoxV2);
    console.info(chalk.green('Successfully upgraded Box to BoxV2'));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
