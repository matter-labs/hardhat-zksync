import { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';
import { Contract } from 'zksync2-js';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(chalk.yellow(`Running deploy`));
    const greeterFactory = await hre.zksync2js.getContractFactory("Greeter");
    const greeter = await greeterFactory.deploy("Hello, world!") as Contract;
    await greeter.waitForDeployment();

    console.info(chalk.green(`Greeter deployed to: ${await greeter.getAddress()}`));
    console.info(chalk.green(`Greeter greeting set to: ${await greeter.greet()}`));
    await greeter.setGreeting("Hello, world again!");
    console.info(chalk.green(`Greeter greeting set to: ${await greeter.greet()}`));
}
