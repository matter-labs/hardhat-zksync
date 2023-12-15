import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import * as hre from 'hardhat';
import {Contract} from 'ethers'

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);
    const deployer = new Deployer(hre, zkWallet);

    // deploy beacon proxy

    const contractName = 'Box';
    const contract = await deployer.loadArtifact(contractName);
    const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
    await beacon.waitForDeployment();
    
    const beaconAddress = await beacon.getAddress();

    const boxBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet,beaconAddress, contract, [42]);
    await boxBeaconProxy.waitForDeployment();

    // upgrade beacon

    const boxV2Implementation = await deployer.loadArtifact('BoxV2');
    await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet,beaconAddress, boxV2Implementation);
    console.info(chalk.green('Successfully upgraded beacon Box to BoxV2 on address: ',beaconAddress));

    const attachTo = new zk.ContractFactory<any[],Contract>(
        boxV2Implementation.abi,
        boxV2Implementation.bytecode,
        deployer.zkWallet,
        deployer.deploymentType
    );
    const upgradedBox =  attachTo.attach(await boxBeaconProxy.getAddress());


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
