import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-web3';
import { Deployer } from '../../../../src/index';
import { WALLET_PRIVATE_KEY } from '../../../constants';

export default async function (hre: HardhatRuntimeEnvironment) {
    const zkWallet = new Wallet(WALLET_PRIVATE_KEY);
    const deployer = new Deployer(hre, zkWallet);
    const artifact = await deployer.loadArtifact('Greeter');

    console.log(`${artifact.contractName} was loaded`);
}
