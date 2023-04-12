import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-web3';

async function main() {
    const hre: HardhatRuntimeEnvironment = require('hardhat');

    const contractName = 'Box';
    console.log('Deploying ' + contractName + '...');

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");

    const deployer = new Deployer(hre, zkWallet);

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'store' });

    await box.deployed();
    console.log(contractName + ' deployed to:', box.address);

    box.connect(zkWallet);
    const value = await box.retrieve();
    console.log('Box value is: ', value.toNumber());
}

main();
