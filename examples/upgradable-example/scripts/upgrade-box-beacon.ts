import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import * as zk from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");
    const deployer = new Deployer(hre, zkWallet);

    // deploy beacon proxy

    const contractName = 'Box';
    const contract = await deployer.loadArtifact(contractName);
    const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
    await beacon.deployed();

    const boxBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, contract, [42]);
    await boxBeaconProxy.deployed();

    // upgrade beacon

    const boxV2Implementation = await deployer.loadArtifact('BoxV2');
    await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, beacon.address, boxV2Implementation);
    console.info(chalk.green('Successfully upgraded beacon Box to BoxV2 on address: ', beacon.address));

    const attachTo = new zk.ContractFactory(
        boxV2Implementation.abi,
        boxV2Implementation.bytecode,
        deployer.zkWallet,
        'create',
    );
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
