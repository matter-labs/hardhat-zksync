import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-web3';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

export default async function (hre: HardhatRuntimeEnvironment) {
    const zkWallet = new Wallet(RICH_WALLET_PK);
    const deployer = new Deployer(hre, zkWallet);
    const artifact = await deployer.loadArtifact('Greeter');

    console.log(`${artifact.contractName} was loaded`);
}
