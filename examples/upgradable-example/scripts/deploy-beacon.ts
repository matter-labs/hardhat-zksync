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
    const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
    await beacon.deployed();
    console.log('Beacon deployed to:', beacon.address);

    const box = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, contract, [42]);
    await box.deployed();
    console.log(contractName + ' beacon proxy deployed to: ', box.address);

    box.connect(zkWallet);
    const value = await box.retrieve();
    console.log('Box value is: ', value.toNumber());
}

main();
