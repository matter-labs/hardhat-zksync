import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-ethers';
import chalk from 'chalk';
import { Deployer } from '../../../../src/index';
import { WALLET_PRIVATE_KEY } from '../../../constants';

export default async function (hre: HardhatRuntimeEnvironment) {
    const zkWallet = new Wallet(WALLET_PRIVATE_KEY);
    const deployer = new Deployer(hre, zkWallet);
    const artifact = await deployer.loadArtifact('Greeter');

    console.info(chalk.yellow(`${artifact.contractName} was loaded`));
}
