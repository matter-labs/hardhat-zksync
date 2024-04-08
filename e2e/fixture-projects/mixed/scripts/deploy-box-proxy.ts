import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Provider, Wallet } from 'zksync-ethers';

import * as hre from 'hardhat';

async function main() {
    const contractName = 'Box';
    console.info(`Deploying ${contractName}...`);

    const TEST_PRIVATE_KEY = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
    const provider = new Provider("http://localhost:8011",undefined,{cacheTimeout:-1})
    const zkWallet = new Wallet(TEST_PRIVATE_KEY,provider);

    const deployer = new Deployer(hre, zkWallet);

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'initialize' });

    await box.deployed();

    box.connect(zkWallet);
    const value = await box.retrieve();
    console.info('Box value is:', Number(value));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
