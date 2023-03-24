import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet, Provider } from 'zksync-web3';
import fs from 'fs';

const PRIVATE_KEY = fs.readFileSync('.secret').toString();

export default async function (hre: HardhatRuntimeEnvironment) {
    const BOX_ADDRESS = '0x2b4a818B27309991Cee01BE0C79808Dc339Be38B';
    // const BOX_ADDRESS = '0xcFEbe41427dB860B7760507f50F39370e27e9D61';

    // const provider = new Provider('https://zksync2-testnet.zksync.dev');
    // const provider = new Provider('http://localhost:3050');

    const wallet = new Wallet(PRIVATE_KEY);

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    // const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0").connect(provider);
    const deployer = new Deployer(hre, wallet);

    const BoxV2 = await deployer.loadArtifact('BoxV2');
    const box = await hre.zkUpgrades.upgradeProxy(deployer, BOX_ADDRESS, BoxV2);
    console.log('Successfully upgraded Box to BoxV2');

    box.connect(wallet);
    const value = await box.retrieve();
    console.log('Box value is', value);
}
