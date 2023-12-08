import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy`));
    const greeterFactory = await hre.zksyncEthers.getContractFactory("Greeter");
    const greeter = await greeterFactory.deploy("Hello, world!");
    
    console.info(chalk.green(`Greeter deployed to: ${await greeter.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greeter.greet()}`));
    const tx = await greeter.setGreeting("Hello, world again!");
    await tx.wait();
    console.info(chalk.green(`Greeter greeting set to: ${await greeter.greet()}`));
}
