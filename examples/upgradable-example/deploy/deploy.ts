import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet, Provider } from 'zksync-web3';
import fs from 'fs';

const PRIVATE_KEY = fs.readFileSync('.secret').toString();

export default async function (hre: HardhatRuntimeEnvironment) {
    const contractName = 'Box';
    console.log('Deploying ' + contractName + '...');

    const provider = new Provider('http://localhost:3050');

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    // const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0").connect(provider);

    const wallet = new Wallet(PRIVATE_KEY);
    const deployer = new Deployer(hre, wallet);

    // const depositHandle = await deployer.zkWallet.deposit({
    //     to: deployer.zkWallet.address,
    //     token: zk.utils.ETH_ADDRESS,
    //     amount: ethers.utils.parseEther('0.01'),
    // });
    // await depositHandle.wait();

    const contract = await deployer.loadArtifact(contractName);
    const box = await hre.zkUpgrades.deployProxy(deployer, contract, [42], { initializer: 'store' });

    await box.deployed();
    console.log(contractName + ' deployed to:', box.address);

    box.connect(wallet);
    const value = await box.retrieve();
    console.log('Box value is: ', value.toNumber());
}
