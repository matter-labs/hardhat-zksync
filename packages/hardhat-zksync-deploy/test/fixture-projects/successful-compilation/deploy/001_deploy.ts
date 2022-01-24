import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-web3';
import { Deployer } from '../../../../src/index';

export default async function (hre: HardhatRuntimeEnvironment) {
    const zkWallet = new Wallet('b026f25c0d248e11568e3e67a5969db7c9b6c4f4cacbdd81d373369c85ab1501');
    const deployer = new Deployer(hre, zkWallet);
    const artifact = await deployer.loadArtifact('Greeter');

    console.log(`${artifact.contractName} was loaded`);
}
