import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "../../../../src/index";

export default async function(hre: HardhatRuntimeEnvironment) {
    const deployer = new Deployer(hre);
    const artifact = await deployer.loadArtifact("Greeter");
    
    console.log(`${artifact.contractName} was loaded`);
}
