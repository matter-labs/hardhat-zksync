import * as hre from 'hardhat';

async function main() {
    const Box = await hre.ethers.getContractFactory('Box');
    const box = await hre.upgrades.deployBeacon(Box);
    await box.deployed();
    console.info(`Box deployed address: ${box.address}`);

    const boxBeaconProxy = await hre.upgrades.deployBeaconProxy(box, Box, [42]);
    await boxBeaconProxy.deployed();
    console.info(`Box Beacon Proxy deployed address: ${boxBeaconProxy.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
