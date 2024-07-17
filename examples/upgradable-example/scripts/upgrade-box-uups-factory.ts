import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { ContractFactory, Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);
    const deployer = new Deployer(hre, zkWallet);

    // deploy proxy
    const contractName = 'BoxUups';

    const boxUupsArtifact = await hre.deployer.loadArtifact(contractName);
    const boxUupsFactory = new ContractFactory(boxUupsArtifact.abi, boxUupsArtifact.bytecode, deployer.zkWallet);
    const box = await hre.zkUpgrades.deployProxy(boxUupsFactory, [42], { initializer: 'initialize' });

    await box.deployed();

    // upgrade proxy implementation

    const boxUupsV2Artifact = await hre.deployer.loadArtifact('BoxUupsV2');

    const boxUupsV2Factory = new ContractFactory(boxUupsV2Artifact.abi, boxUupsV2Artifact.bytecode, deployer.zkWallet);
    const upgradedBox = await hre.zkUpgrades.upgradeProxy(box.address, boxUupsV2Factory);
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
