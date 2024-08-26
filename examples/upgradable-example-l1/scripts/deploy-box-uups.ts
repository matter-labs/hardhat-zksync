import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const Box = await hre.ethers.getContractFactory('BoxUups');
    const box = await hre.upgrades.deployProxy(Box, [42], { initializer: 'initialize' });
    await box.deployed();
    console.info(`Box Uups deployed address: ${box.address}`);

    const value = await box.retrieve();
    console.info(chalk.cyan('Box value is: ', value.toNumber()));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
