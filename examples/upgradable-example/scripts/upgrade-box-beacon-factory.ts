import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);
    const deployer = new Deployer(hre, zkWallet);

    // deploy beacon proxy

    const contractName = 'Box';
    const boxArtifact = await hre.deployer.loadArtifact(contractName);
    const boxFactory = new zk.ContractFactory(boxArtifact.abi, boxArtifact.bytecode, deployer.zkWallet);

    const beacon = await hre.zkUpgrades.deployBeacon(boxFactory);
    await beacon.deployed();
    const beaconAddress = beacon.address;
    const boxBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beaconAddress, boxArtifact, [42]);
    await boxBeaconProxy.deployed();

    // upgrade beacon

    const boxV2Artifact = await hre.deployer.loadArtifact('BoxV2');
    await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, beaconAddress, boxV2Artifact);
    console.info(chalk.green('Successfully upgraded beacon Box to BoxV2 on address: ', beaconAddress));

    const attachTo = new zk.ContractFactory(boxV2Artifact.abi, boxV2Artifact.bytecode, deployer.zkWallet);
    const upgradedBox = attachTo.attach(boxBeaconProxy.address);

    upgradedBox.connect(zkWallet);
    // wait some time before the next call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const value = await upgradedBox.retrieve();
    console.info(chalk.cyan('New box value is', value));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
