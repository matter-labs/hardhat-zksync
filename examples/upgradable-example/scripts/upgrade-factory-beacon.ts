import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';
import * as zk from 'zksync-ethers';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = new Wallet('0x11a886803cd3d49695b838f18ab9697feafd8465dc423c12eb6c3722727a4bba');
    const deployer = new Deployer(hre, zkWallet);

    const contractName = 'Factory';
    const contract = await deployer.loadArtifact(contractName);
    const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
    await beacon.waitForDeployment();

    const factoryBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, contract, []);
    await factoryBeaconProxy.waitForDeployment();

    // upgrade beacon

    const factoryV2Implementation = await deployer.loadArtifact('FactoryV2');
    await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, await beacon.getAddress(), factoryV2Implementation);
    console.info(chalk.green('Successfully upgraded beacon Factory to FactoryV2 on address: ', beacon.address));

    const attachTo = new zk.ContractFactory(
        factoryV2Implementation.abi,
        factoryV2Implementation.bytecode,
        deployer.zkWallet,
        deployer.deploymentType,
    );
    const upgradedFactory = attachTo.attach(await factoryBeaconProxy.getAddress());
    upgradedFactory.connect(zkWallet);
    const number = await upgradedFactory.getNumberOfDeployedContracts();
    if (number === 0) {
        throw new Error(
            'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
        );
    }

    const chainId = await hre.network.provider.send('eth_chainId', []);
    if (chainId === '0x12c') {
        let _ = hre.run('verify:verify', { address: await upgradedFactory.getAddress() });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
