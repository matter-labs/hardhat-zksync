import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';
import * as zk from 'zksync-ethers';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");
    const deployer = new Deployer(hre, zkWallet);

    const contractName = 'Factory';
    const contract = await deployer.loadArtifact(contractName);
    const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
    await beacon.deployed();

    const factoryBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, contract, []);
    await factoryBeaconProxy.deployed();

    // upgrade beacon

    const factoryV2Implementation = await deployer.loadArtifact('FactoryV2');
    await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, beacon.address, factoryV2Implementation);
    console.info(chalk.green('Successfully upgraded beacon Factory to FactoryV2 on address: ', beacon.address));

    const attachTo = new zk.ContractFactory(
        factoryV2Implementation.abi,
        factoryV2Implementation.bytecode,
        deployer.zkWallet,
        'create',
    );
    const upgradedFactory = attachTo.attach(factoryBeaconProxy.address);
    upgradedFactory.connect(zkWallet);
    const number = await upgradedFactory.getNumberOfDeployedContracts();
    if (number === 0) {
        throw new Error(
            'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
