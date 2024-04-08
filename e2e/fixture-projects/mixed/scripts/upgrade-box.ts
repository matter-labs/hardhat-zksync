import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Provider, Wallet } from 'zksync-ethers';
import * as hre from 'hardhat';
import { Wallet, Provider } from "zksync-ethers";

async function main() {
    const TEST_PRIVATE_KEY = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
    const provider = new Provider("http://localhost:8011",undefined,{cacheTimeout:-1})
    const zkWallet = new Wallet(TEST_PRIVATE_KEY,provider);
    
    const deployer = new Deployer(hre, zkWallet);
    // deploy proxy
    const contractName = 'Box';

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'store' });

    await box.deployed();

    // upgrade proxy implementation

    const BoxV2 = await deployer.loadArtifact('BoxV2');
    const upgradedBox = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, box.address, BoxV2);
    console.info('Successfully upgraded Box to BoxV2');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
