import * as hre from 'hardhat';

async function main() {
    const Box = await hre.ethers.getContractFactory("Box");
    const box = await hre.upgrades.deployProxy(Box,[42]);
    await box.waitForDeployment()
    console.info("Box deployed address: " + await box.getAddress())
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
