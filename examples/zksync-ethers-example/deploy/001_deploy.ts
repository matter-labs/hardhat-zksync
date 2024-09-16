import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';
import { Wallet } from 'zksync-ethers';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy`));
    const wallet = await hre.zksyncEthers.getWallet(4);

    // console.info(chalk.yellow(`Depositing to wallet: ${await wallet.getAddress()}`));
    // const depositHandle = await wallet.deposit({
    //     to: wallet.address,
    //     token: utils.ETH_ADDRESS,
    //     amount: ethers.parseEther('0.001'),
    // });
    // await depositHandle.wait();

    const artifact = await hre.zksyncEthers.loadArtifact('Greeter');
    const greets = await hre.zksyncEthers.deployContract(artifact, ['Hello, world with loadArtifact!'], wallet);
    const wallet1 = greets.signer as Wallet;
    console.info(chalk.yellow(`Deploying Greeter with wallet: ${await wallet1.getAddress()}`));
    console.info(chalk.green(`Greeter deployed to: ${greets.address}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets.greet()}`));
    const tx1 = await greets.setGreeting('Hello, world again with loadArtifact!');
    await tx1.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greets.greet()}`));

    const greeterFactory = await hre.zksyncEthers.getContractFactory(artifact.abi, artifact.bytecode);
    const greeter = await greeterFactory.deploy('Hello, world with abi and bytecode!');
    const wallet2 = greeter.signer as Wallet;
    console.info(chalk.yellow(`Deploying Greeter with wallet: ${await wallet2.getAddress()}`));
    console.info(chalk.green(`Greeter deployed to: ${greeter.address}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greeter.greet()}`));
    const tx = await greeter.setGreeting('Hello, world again with abi and bytecode!');
    await tx.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greeter.greet()}`));

    const greeterFactoryFromName = await hre.zksyncEthers.getContractFactory(
        'Greeter',
        await hre.zksyncEthers.getWallet('0xbe79721778b48bcc679b78edac0ce48306a8578186ffcb9f2ee455ae6efeace1'),
    );
    const greeterFromName = await greeterFactoryFromName.deploy('Hello, world with name!');
    const wallet3 = greeterFromName.signer as Wallet;
    console.info(chalk.yellow(`Deploying Greeter with wallet: ${await wallet3.getAddress()}`));
    console.info(chalk.green(`Greeter deployed to: ${greeterFromName.address}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greeterFromName.greet()}`));
    const tx2 = await greeter.setGreeting('Hello, world again with name!');
    await tx2.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greeter.greet()}`));
}
