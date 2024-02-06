import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';

export default async function (hre: HardhatRuntimeEnvironment) {
    const artifact = await hre.deployer.loadArtifact('Greeter.sol');
    const contract = await hre.deployer.deploy(artifact, ['Hello world!']);
    console.info(chalk.green(`Deployed Greeter at ${await contract.getAddress()}`));


    hre.deployer.changeWallet('0x3eb15da85647edd9a1159a4a13b9e7c56877c4eb33f614546d4db06a51868b1c');
    const contract2 = await hre.deployer.deploy(artifact, ['Hello world 2!']);
    console.info(chalk.green(`Deployed Greeter at ${await contract2.getAddress()}`));
}
