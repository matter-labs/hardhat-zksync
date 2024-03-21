import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Provider, Wallet } from 'zksync-ethers';

import * as hre from 'hardhat';

async function main() {
    const contractName = 'Box';
    console.info(`Deploying ${contractName}...`);

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const provider = new Provider("http://localhost:8011",undefined,{cacheTimeout:-1})
    const zkWallet = Wallet.fromMnemonic(testMnemonic,provider);

    const deployer = new Deployer(hre, zkWallet);

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'initialize' });

    await box.waitForDeployment();

    box.connect(zkWallet);
    const value = await box.retrieve();
    console.info('Box value is: ', value);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
