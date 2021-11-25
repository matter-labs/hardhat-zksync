import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as ethers from "ethers";
import * as zk from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// An example of a deploy script which will deploy and call a simple contract.
export default async function(hre: HardhatRuntimeEnvironment) {
    // Initialize an Ethereum wallet.
    const testMnemonic = "stuff slice staff easily soup parent arm payment cotton trade scatter struggle";
    const ethWallet = ethers.Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");

    // Initalize two providers: one for the Ethereum RPC (layer 1), and one for the zkSync RPC (layer 2). We will need both.
    const ethWeb3Provider = new ethers.providers.JsonRpcProvider(hre.config.zkSyncDeploy.l1Network);
    const zkWeb3Provider = new zk.Provider(hre.config.zkSyncDeploy.zkSyncRpc);

    // Create a zkSync wallet using the Ethereum wallet created above.
    const zkWallet = new zk.Wallet(ethWallet.privateKey, zkWeb3Provider, ethWeb3Provider);

    // Create deployer object and load desired artifact.
    const deployer = new Deployer(hre, zkWallet);
    const artifact = await deployer.loadArtifact("Greeter");

    // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    const greeterContract = await deployer.deploy(artifact, ["Hi there!"]);

    const contractAddress = greeterContract.contractAddress;
    console.log(`${artifact.contractName} was deployed to ${contractAddress}!`);

    // TODO: add an example of calling the contract.
}
