import * as ethers from 'ethers';
import * as zk from 'zksync-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import chalk from 'chalk';

export default async function (hre: HardhatRuntimeEnvironment) {
    //return;
    console.info(chalk.yellow('Running deploy script for the Account Abstraction'));
    // Initialize an Ethereum wallet.
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = zk.Wallet.fromMnemonic(testMnemonic);

    // Create deployer objects and load desired artifacts.
    const contractDeployer = new Deployer(hre, zkWallet, 'create');
    const aaDeployer = new Deployer(hre, zkWallet, 'createAccount');
    const greeterArtifact = await contractDeployer.loadArtifact('Greeter');
    const aaArtifact = await aaDeployer.loadArtifact('TwoUserMultisig');

    const provider = aaDeployer.zkWallet.provider;

    // Deposit some funds to L2 in order to be able to perform L2 transactions.
    const depositHandle = await contractDeployer.zkWallet.deposit({
        to: await contractDeployer.zkWallet.getAddress(),
        token: zk.utils.ETH_ADDRESS,
        amount: ethers.parseEther('0.001'),
    });
    await depositHandle.wait();

    const greeterContract = await contractDeployer.deploy(greeterArtifact, ['Hi there!']);

    console.info(chalk.green(`Greeter was deployed to ${await greeterContract.getAddress()}`));

    // The two owners of the multisig
    const owner1 = zk.Wallet.createRandom();
    const owner2 = zk.Wallet.createRandom();

    const aa = await aaDeployer.deploy(aaArtifact, [owner1.address, owner2.address], undefined, []);

    const multisigAddress = await aa.getAddress();

    console.info(chalk.green(`Multisig was deployed to ${multisigAddress}`));

    await (
        await contractDeployer.zkWallet.sendTransaction({
            to: multisigAddress,
            // You can increase the amount of ETH sent to the multisig
            value: ethers.parseEther('0.003'),
        })
    ).wait();

    const newGreeting = 'Hello!';
    let aaTx = await greeterContract.setGreeting.populateTransaction(newGreeting);
    aaTx.from = await owner2.getAddress();
    const gasLimit = await provider.estimateGas(aaTx);
    const gasPrice = await provider.getGasPrice();

    aaTx = {
        ...aaTx,
        from: multisigAddress,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        chainId: (await provider.getNetwork()).chainId,
        nonce: await provider.getTransactionCount(multisigAddress),
        type: 113,
        customData: {
            gasPerPubdata: zk.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        } as zk.types.Eip712Meta,
        value: ethers.toBigInt(0)
    };
    const signedTxHash = zk.EIP712Signer.getSignedDigest(aaTx);

    const signature = ethers.concat([
        // Note, that `signMessage` wouldn't work here, since we don't want
        // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
        ethers.Signature.from(owner1.signingKey.sign(signedTxHash)).serialized,
        ethers.Signature.from(owner2.signingKey.sign(signedTxHash)).serialized,
    ]);

    aaTx.customData = {
        ...aaTx.customData,
        customSignature: signature,
    };

    console.log(`The multisig's nonce before the first tx is ${await provider.getTransactionCount(multisigAddress)}`);

    const serialized = zk.utils.serializeEip712(aaTx)
   
    const tx = await provider.broadcastTransaction(serialized);
    await tx.wait();
    
    console.log(`The multisig's nonce after the first tx is ${await provider.getTransactionCount(multisigAddress)}`);
    const greetingFromContract = await greeterContract.greet();
    if (greetingFromContract === newGreeting) {
        console.info(chalk.green('Successfully initiated tx from deployed multisig!'));
    } else {
        throw new Error(`Contract said something unexpected: ${greetingFromContract}`);
    }

}
