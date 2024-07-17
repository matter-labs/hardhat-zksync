import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { ContractFactory, Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);
    const deployer = new Deployer(hre, zkWallet);
    // deploy proxy
    const contractName = 'Box';

    const boxArtifact = await hre.deployer.loadArtifact(contractName);
    const boxFactory = new ContractFactory(boxArtifact.abi, boxArtifact.bytecode, deployer.zkWallet);

    const box = await hre.zkUpgrades.deployProxy(boxFactory, [42], { initializer: 'store' });

    await box.deployed();

    // upgrade proxy implementation

    const boxV2Artifact = await hre.deployer.loadArtifact('BoxV2');
    const boxV2Factory = new ContractFactory(boxV2Artifact.abi, boxV2Artifact.bytecode, deployer.zkWallet);
    const upgradedBox = await hre.zkUpgrades.upgradeProxy(box.address, boxV2Factory);
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
