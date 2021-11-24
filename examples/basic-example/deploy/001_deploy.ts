import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Wallet } from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function(hre: HardhatRuntimeEnvironment) {
    const zkWallet = new Wallet("b026f25c0d248e11568e3e67a5969db7c9b6c4f4cacbdd81d373369c85ab1501")
    const deployer = new Deployer(hre, zkWallet);
    const artifact = await deployer.loadArtifact("Greeter");

    const tx = await deployer.deploy(artifact, []);
    const receipt = await tx.wait();
    
    if (receipt.status !== 1) {
        console.error("Contract deployment failed");
        return;
    }

    const contractAddress = receipt.contractAddress;
    console.log(`${artifact.contractName} was deployed to ${contractAddress}!`);
}
