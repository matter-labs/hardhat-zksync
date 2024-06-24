import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';

import * as hre from 'hardhat';

async function main() {
    const contractName = 'FactoryUups';
    console.info(`Deploying ${contractName}...`);

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");

    const deployer = new Deployer(hre, zkWallet);

    const contract = await deployer.loadArtifact(contractName);
    const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], { initializer: 'initialize' });

    await factory.deployed();

    factory.connect(zkWallet);
    const number = await factory.getNumberOfDeployedContracts();
    if (number === 0) {
        throw new Error(
            'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
        );
    }
    console.info("Succssfully deployed upgradable factor contract.")
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
