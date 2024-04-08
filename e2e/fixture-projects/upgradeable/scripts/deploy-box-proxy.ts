import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';

import * as hre from 'hardhat';

async function main() {
    const contractName = 'Box';
    console.info(`Deploying ${contractName}...`);

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic);

    const deployer = new Deployer(hre, zkWallet);

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'initialize' });

    await box.deployed();

    box.connect(zkWallet);
    const value = await box.retrieve();
    console.info('Box value is:', Number(value));

    const chainId = await hre.network.provider.send('eth_chainId', []);
    if (chainId === '0x12c') {
        const _ = hre.run('verify:verify', { address: await box.getAddress() });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
