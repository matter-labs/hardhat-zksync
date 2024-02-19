import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';

import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");
    const deployer = new Deployer(hre, zkWallet);

    const contractName = 'Factory';

    const contract = await deployer.loadArtifact(contractName);
    const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], { initializer: 'initialize' });

    await factory.deployed();

    const FactoryV2 = await deployer.loadArtifact('FactoryV2');
    const upgradedFactory = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, factory.address, FactoryV2);
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
        let _ = hre.run('verify:verify', { address: upgradedFactory.address });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
