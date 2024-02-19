import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = new Wallet('0x11a886803cd3d49695b838f18ab9697feafd8465dc423c12eb6c3722727a4bba');
    const deployer = new Deployer(hre, zkWallet);

    const contractName = 'Factory';

    const contract = await deployer.loadArtifact(contractName);
    const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], { initializer: 'initialize' });

    await factory.waitForDeployment();

    const FactoryV2 = await deployer.loadArtifact('FactoryV2');
    const upgradedFactory = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, await factory.getAddress(), FactoryV2);
    console.info(chalk.green('Successfully upgraded Factory to FactoryV2'));

    upgradedFactory.connect(zkWallet);
    const number = await factory.getNumberOfDeployedContracts();
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
