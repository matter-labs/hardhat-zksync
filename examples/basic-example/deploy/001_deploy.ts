import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as ethers from "ethers";
import * as zk from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// An example of a deploy script which will deploy and call a simple contract.
export default async function(hre: HardhatRuntimeEnvironment) {
    console.log(`Running deploy script for the Greeter contract`);

    // Initialize an Ethereum wallet.
    const testMnemonic = "stuff slice staff easily soup parent arm payment cotton trade scatter struggle";
    const ethWallet = ethers.Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");

    // Initalize two providers: one for the Ethereum RPC (layer 1), and one for the zkSync RPC (layer 2). We will need both.
    const ethWeb3Provider = new ethers.providers.JsonRpcProvider(hre.config.zkSyncDeploy.l1Network);
    const zkWeb3Provider = new zk.Provider(hre.config.zkSyncDeploy.zkSyncRpc);

    // Create a zkSync wallet using the Ethereum wallet created above.
    const zkWallet = new zk.Wallet(ethWallet.privateKey, zkWeb3Provider, ethWeb3Provider);

    // Deposit some funds to L2 in order to be able to perform deposits.
    // const depositAmount = ethers.utils.parseEther("0.001"); // TODO: Why parseEther doesn't work?
    const depositHandle = await zkWallet.deposit({
        to: zkWallet.address,
        token: zk.utils.ETH_ADDRESS,
        amount: "1000000000000000000", // TODO: Why parseEther doesn't work?
    });
    await depositHandle.wait();

    // Create deployer object and load desired artifact.
    const deployer = new Deployer(hre, zkWallet);
    const artifact = await deployer.loadArtifact("Greeter");

    // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    const greeting = "Hi there!";
    const greeterContract = await deployer.deploy(artifact, [greeting]);

    const contractAddress = greeterContract.address;
    console.log(`${artifact.contractName} was deployed to ${contractAddress}!`);

    // Call the deployed contract.
    const greetingFromContract = await greeterContract.greet();
    if (greetingFromContract == greeting) {
        console.log(`Contract greets us!`);
    } else {
        console.error(`Contract said something unexpected: ${greetingFromContract}`);
    }
}
