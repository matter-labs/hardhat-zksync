import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const box = await hre.ethers.getContractFactory('Box');
    const beacon = await hre.upgrades.deployBeacon(box);
    await beacon.deployed();

    const boxBeaconProxy = await hre.upgrades.deployBeaconProxy(beacon, box, [42]);
    await boxBeaconProxy.deployed();

    // upgrade beacon

    const boxV2 = await hre.ethers.getContractFactory('BoxV2');
    const boxV2Upgraded = await hre.upgrades.upgradeBeacon(beacon.address, boxV2);
    console.info(chalk.green('Successfully upgraded beacon Box to BoxV2 on address: ', beacon.address));
    await boxV2Upgraded.deployed();

    // wait some time before the next call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const value = await boxV2Upgraded.retrieve();
    console.info(chalk.cyan('New box value is', value));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
