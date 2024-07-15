import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const contractName = 'Box';
    console.info(chalk.yellow(`Deploying ${contractName}...`));

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);

    const deployer = new Deployer(hre, zkWallet);

    const boxArtifact = await hre.deployer.loadArtifact("Box");
    const beacon = await hre.zkUpgrades.deployBeacon(boxArtifact,deployer.zkWallet);
    await beacon.waitForDeployment();

    const box = await hre.zkUpgrades.deployBeaconProxy(await beacon.getAddress(), boxArtifact,deployer.zkWallet, [42], {});
    await box.waitForDeployment();

    box.connect(zkWallet);
    const value = await box.retrieve();
    console.info(chalk.cyan('Box value is: ', value));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
