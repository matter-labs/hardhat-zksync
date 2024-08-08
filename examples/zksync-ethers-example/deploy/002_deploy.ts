import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HardhatZksyncSigner } from '@matterlabs/hardhat-zksync-ethers';
import chalk from 'chalk';
import { Contract, Wallet } from 'zksync-ethers';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy`));;
    const signer = (await hre.ethers.provider.getSigner('0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA')) as HardhatZksyncSigner;
    const greets = await hre.ethers.deployContract('Greeter', ['Hello, world with loadArtifact!'], signer);
    const singerForDeploy1 = greets.runner as HardhatZksyncSigner;
    console.info(chalk.yellow(`Deploying with signer: ${await singerForDeploy1.getAddress()}`));
    console.info(chalk.green(`Greeter deployed to: ${await greets.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets.greet()}`));
    const tx1 = await greets.setGreeting('Hello, world again with loadArtifact!');
    await tx1.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greets.greet()}`));
    const greeterFactory1 = await hre.ethers.getContractFactory('Greeter', signer, 'create');
    const greets2 = await greeterFactory1.deploy('Hello, world with name!');
    const singerForDeploy2 = greeterFactory1.runner as HardhatZksyncSigner;
    console.info(chalk.yellow(`Deploying Greeter with signer: ${await singerForDeploy2.getAddress()}`));
    console.info(chalk.green(`Greeter deployed to: ${await greets2.getAddress()}`));
    const artifact = await hre.ethers.loadArtifact('Greeter');
    const greeterFactory2 = await hre.ethers.getContractFactory(artifact.abi, artifact.bytecode, signer, 'create');
    const greets3 = await greeterFactory2.deploy('Hello, world with abi and bytecode!');
    const singerForDeploy3 = greets3.runner as HardhatZksyncSigner;
    console.info(chalk.yellow(`Deploying Greeter with signer: ${await singerForDeploy3.getAddress()}`));
    console.info(chalk.green(`Greeter deployed to: ${await greets3.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets3.greet()}`));
    const tx = await greets3.setGreeting('Hello, world again with abi and bytecode!');
    await tx.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greets3.greet()}`));

    const greeterFactory3 = await hre.ethers.getContractFactory(
        'Greeter',
        await hre.ethers.getWallet(),
    );

    const greets4 = await greeterFactory3.deploy('Hello, world with name!');
    const walletForDeploy1 = greets4.runner as Wallet;
    console.info(chalk.yellow(`Deploying Greeter with wallet: ${await walletForDeploy1.getAddress()}`));
    console.info(chalk.green(`Greeter deployed to: ${await greets4.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets4.greet()}`));
    const tx2 = await greets4.setGreeting('Hello, world again with name!');
    await tx2.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greets4.greet()}`));

    const contract1 = await hre.ethers.getContractAt('Greeter', await greets4.getAddress(), signer);
    console.info(chalk.green(`Greeter from getContractAt set to: ${await contract1.greet()}`));

    const contract2 = await hre.ethers.getContractAt(artifact.abi, await greets3.getAddress());
    console.info(chalk.green(`Greeter from getContractAt set to: ${await contract2.greet()}`));

}
