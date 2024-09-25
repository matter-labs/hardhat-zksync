import chalk from 'chalk';
import { Signer } from 'ethers';
import hre from 'hardhat';

async function main(){
    console.info(chalk.yellow(`Running deploy script 002_deploy.ts`));

    console.log(await hre.network.provider.send('eth_chainId'));
    console.info(chalk.yellow(`Running deploy script 002_deploy.ts`));
    //Deploy Greeter contract with provided signer and name
    const signer = await hre.ethers.getSigner('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');
    const greets = await hre.ethers.deployContract('Greeter', ['Hello, world with loadArtifact!'], signer);
    await greets.waitForDeployment();
    const greetsRunner = greets.runner as Signer;
    console.info(chalk.green(`Greeter deployed to: ${await greets.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets.greet()}`));
    const tx1 = await greets.setGreeting('Hello, world again with loadArtifact!');
    await tx1.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greets.greet()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greetsRunner.getAddress()}`));

    console.log('----------------------------------')

    console.log('Greeter contract deployed with name factory');
    const greeterFactory1 = await hre.ethers.getContractFactory('Greeter', signer,);
    const greets2 = await greeterFactory1.deploy('Hello, world with name!');
    await greets2.waitForDeployment();
    const greets2Runner = greets2.runner as Signer;
    console.info(chalk.green(`Greeter deployed to: ${await greets2.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets2.greet()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets2Runner.getAddress()}`));

    console.log('----------------------------------')

    console.log('Greeter contract deployed with abi and bytecode');
    const artifact = await hre.artifacts.readArtifact('Greeter');
    const greeterFactory2 = await hre.ethers.getContractFactory(artifact.abi, artifact.bytecode);
    const greets3 = await greeterFactory2.deploy('Hello, world with abi and bytecode!');
    await greets3.waitForDeployment();
    const greets3Runner = greets3.runner as Signer;
    console.info(chalk.green(`Greeter deployed to: ${await greets3.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets3.greet()}`));
    const tx = await greets3.setGreeting('Hello, world again with abi and bytecode!');
    await tx.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greets3.greet()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets3Runner.getAddress()}`));

    console.log('----------------------------------')

    console.log('Greeter contract deployed with artifact');
    const greeterFactory3 = await hre.ethers.getContractFactoryFromArtifact(artifact);
    const greets4 = await greeterFactory3.deploy('Hello, world with artifact!');
    await greets4.waitForDeployment();
    const greets4Runner = greets4.runner as Signer;
    console.info(chalk.green(`Greeter deployed to: ${await greets4.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets4.greet()}`));
    const tx2 = await greets4.setGreeting('Hello, world again with artifact!');
    await tx2.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greets4.greet()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets4Runner.getAddress()}`));

    console.log('----------------------------------')

    console.log('Greeter contract deployed with factory and signer2');
    const [,,signer2] = await hre.ethers.getSigners();
    const greeterFactory4 = await hre.ethers.getContractFactory(
        'Greeter',
        signer2
    );
    const greets5 = await greeterFactory4.deploy('Hello, world with name!');
    await greets5.waitForDeployment();
    const greets5Runner = greets5.runner as Signer;
    console.info(chalk.green(`Greeter deployed to: ${await greets5.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets5.greet()}`));
    const tx3 = await greets5.setGreeting('Hello, world again with name!');
    await tx3.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greets5.greet()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greets5Runner.getAddress()}`));

    console.log('----------------------------------')

    console.log('Greeter get contract with name');
    const signer3 = await hre.ethers.provider.getSigner('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');
    const contract1 = await hre.ethers.getContractAt('Greeter', await greets2.getAddress(), signer3);
    const contract1Runner = contract1.runner as Signer;
    console.info(chalk.green(`Greeter from getContractAt set to: ${await contract1.greet()}`));
    console.info(chalk.green('Runner from getContractAt set to: ', await contract1Runner.getAddress()));

    console.log('----------------------------------')

    console.log('Greeter get contract with abi');
    const contract2 = await hre.ethers.getContractAt(artifact.abi, await greets3.getAddress());
    console.info(chalk.green(`Greeter from getContractAt set to: ${await contract2.greet()}`));
    const contract2Runner = contract2.runner as Signer;
    console.info(chalk.green('Runner from getContractAt set to: ', await contract2Runner.getAddress()));

    console.log('----------------------------------')

    console.log('Greeter get contract with artifact');
    const contract3 = await hre.ethers.getContractAtFromArtifact(artifact, await greets4.getAddress());
    console.info(chalk.green(`Greeter from getContractAt set to: ${await contract3.greet()}`));
    const contract3Runner = contract3.runner as Signer;
    console.info(chalk.green('Runner from getContractAt set to: ', await contract3Runner.getAddress()));

    const newContractFactory = new hre.ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const deployedContract = await newContractFactory.deploy("Hello World with new contract factory.");
    console.info(chalk.green(`Contract with new ContractFactory deployed to ${await deployedContract.getAddress()}`))

    const newContract = new hre.ethers.Contract(await deployedContract.getAddress(),artifact.abi,signer);
    console.info(await newContract.greet());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
