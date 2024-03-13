import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.info(`Running deploy script for the Test contract`);
    await hre.deployer.deploy("TestCoin", []);
    console.info(`Test coin was deployed!`);
}
