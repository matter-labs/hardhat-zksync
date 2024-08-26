import * as hre from 'hardhat';

async function main() {
    const Box = await hre.ethers.getContractFactory("Box");
    const box = await hre.upgrades.deployProxy(Box,[42]);
    await box.waitForDeployment()
    console.info("Box deployed address: " + await box.getAddress())

    const BoxV2 = await hre.ethers.getContractFactory("BoxV2");
    const boxV2 = await hre.upgrades.upgradeProxy(await box.getAddress(),BoxV2)
    console.info("Box V2 address: " + await boxV2.getAddress())

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
