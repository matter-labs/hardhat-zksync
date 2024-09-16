import * as hre from 'hardhat';

async function main() {
    const Box = await hre.ethers.getContractFactory("Box");
    const box = await hre.upgrades.deployBeacon(Box);
    await box.waitForDeployment()
    console.info("Box deployed address: " + await box.getAddress())

    const boxBeaconProxy = await hre.upgrades.deployBeaconProxy(box, Box, [42]);
    await boxBeaconProxy.waitForDeployment();
    console.info("Box Beacon Proxy deployed address: " + await boxBeaconProxy.getAddress())

    const BoxV2 = await hre.ethers.getContractFactory("BoxV2");
    const boxV2 = await hre.upgrades.upgradeBeacon(await box.getAddress(),BoxV2)
    console.info("Box V2 address: " + await boxV2.getAddress())

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
