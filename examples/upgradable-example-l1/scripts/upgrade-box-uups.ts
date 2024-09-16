import * as hre from 'hardhat';

async function main() {
    const Box = await hre.ethers.getContractFactory("BoxUups");
    const box = await hre.upgrades.deployProxy(Box,[42],{ initializer: 'initialize'});
    await box.waitForDeployment()
    console.info("Box deployed address: " + await box.getAddress())

    const BoxUupsV2 = await hre.ethers.getContractFactory("BoxUupsV2");
    const boxUupsV2 = await hre.upgrades.upgradeProxy(await box.getAddress(),BoxUupsV2)
    console.info("Box UUps V2 address: " + await boxUupsV2.getAddress())
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
