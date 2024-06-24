import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Provider, Wallet } from 'zksync-ethers';
import * as hre from 'hardhat';

async function main() {
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const provider = new Provider("http://0.0.0.0:8011",undefined,{cacheTimeout:-1})
    const zkWallet = Wallet.fromMnemonic(testMnemonic,provider);

    const deployer = new Deployer(hre, zkWallet);
    // deploy proxy
    const contractName = 'Box';

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'store' });

    await box.waitForDeployment();

    // upgrade proxy implementation

    const BoxV2 = await deployer.loadArtifact('BoxV2');
    const upgradedBox = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, await box.getAddress(), BoxV2);
    console.info('Successfully upgraded Box to BoxV2');

    upgradedBox.connect(zkWallet);
    // wait some time before the next call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const value = await upgradedBox.retrieve();
    console.info('Box value is', value);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
