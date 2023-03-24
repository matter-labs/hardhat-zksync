import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-web3';
import fs from 'fs';
import * as zk from 'zksync-web3';
import { Provider } from 'zksync-web3';

const PRIVATE_KEY = fs.readFileSync('.secret').toString();

export default async function (hre: HardhatRuntimeEnvironment) {
    const BOX_ADDRESS = '0x10296C9F83c90eeaf6a9f3402d0A2515c582310f';
    const contractName = 'BoxV2';

    const provider = new Provider('https://zksync2-testnet.zksync.dev');

    const wallet = new Wallet(PRIVATE_KEY).connect(provider);
    const deployer = new Deployer(hre, wallet);

    const boxABI = (await deployer.loadArtifact(contractName)).abi;

    const boxContract = new zk.Contract(BOX_ADDRESS, boxABI, wallet);

    // initialize new contrct basde on box, but with different signer
    const value = await boxContract.retrieve();
    const printingValue = contractName.includes('V2') ? value : value.toNumber();
    console.log('Box value is' + printingValue);
}
