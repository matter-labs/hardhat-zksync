import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-web3';
import * as zk from 'zksync-web3';

async function main() {
    const hre: HardhatRuntimeEnvironment = require('hardhat');

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");
    const deployer = new Deployer(hre, zkWallet);

    // deploy beacon proxy

    const contractName = 'Box';
    const contract = await deployer.loadArtifact(contractName);
    const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
    await beacon.deployed();

    const boxBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, contract, [42]);
    await boxBeaconProxy.deployed();

    // upgrade beacon

    const boxV2Implementation = await deployer.loadArtifact('BoxV2');
    await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, boxV2Implementation, beacon.address);
    console.log('Successfully upgraded beacon Box to BoxV2 on address: ', beacon.address);

    const attachTo = new zk.ContractFactory(
        boxV2Implementation.abi,
        boxV2Implementation.bytecode,
        deployer.zkWallet,
        deployer.deploymentType
    );
    const upgradedBox = await attachTo.attach(boxBeaconProxy.address);

    upgradedBox.connect(zkWallet);
    // wait some time before the next call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const value = await upgradedBox.retrieve();
    console.log('New box value is', value);
}

main();
