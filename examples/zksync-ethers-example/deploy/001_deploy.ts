import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';
import { Wallet, utils } from 'zksync-ethers';
import { ethers } from 'ethers';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy`));
    const wallet = await hre.zksyncEthers.getWallet(4);

    const artifact = await hre.zksyncEthers.loadArtifact('Greeter');
    console.info(chalk.yellow(`Deploying Greeter with wallet: ${await wallet.getAddress()}`));
    const greets = await hre.zksyncEthers.deployContract(artifact, ['Hello, world!'], wallet);
    console.info(chalk.green(`Greeter deployed to: ${await greets.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets.greet()}`));

    const tx1 = await greets.setGreeting('Hello, world again 2!');
    await tx1.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greets.greet()}`));


    const depositHandle = await wallet.deposit({
        to: wallet.address,
        token: utils.ETH_ADDRESS,
        amount: ethers.parseEther('0.001'),
    });
    await depositHandle.wait();


    const greeterFactory = await hre.zksyncEthers.getContractFactory(artifact.abi, artifact.bytecode);
    const wallet2 = greeterFactory.runner as Wallet;
    console.info(chalk.yellow(`Deploying Greeter with wallet: ${await wallet2.getAddress()}`));
    const greeter = await greeterFactory.deploy('Hello, world!');

    console.info(chalk.green(`Greeter deployed to: ${await greeter.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greeter.greet()}`));
    const tx = await greeter.setGreeting('Hello, world again!');
    await tx.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greeter.greet()}`));
}
