import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as ethers from 'ethers';
import * as zk from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(`Running deploy script`);

    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = zk.Wallet.fromMnemonic(testMnemonic,"m/44'/60'/0'/0/0");

    const deployer = new Deployer(hre, zkWallet);

    const voting = await deployer.loadArtifact('Voting');
    const proposalsBytes32 = [
        ethers.utils.formatBytes32String("Proposal1"),
        ethers.utils.formatBytes32String("Proposal2")
    ];
    const deployedVoting = await deployer.deploy(voting,[proposalsBytes32])
    await deployedVoting.deployed();

    console.info("Voting deployed to: " +deployedVoting.address);
    console.info("Voting sucessfull!")
}
