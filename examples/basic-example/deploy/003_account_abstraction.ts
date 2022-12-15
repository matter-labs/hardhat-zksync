import * as ethers from 'ethers';
import * as zk from 'zksync-web3';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

export default async function (hre: HardhatRuntimeEnvironment) {
    console.log('Running deploy script for the Account Abstraction');

    // Initialize an Ethereum wallet.
    const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
    const zkWallet = zk.Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");

    // Create deployer objects and load desired artifacts.
    const contractDeployer = new Deployer(hre, zkWallet, 'create');
    const aaDeployer = new Deployer(hre, zkWallet, 'createAccount');
    const greeterArtifact = await contractDeployer.loadArtifact('Greeter');
    const aaArtifact = await aaDeployer.loadArtifact('TwoUserMultisig');

    const provider = aaDeployer.zkWallet.provider;

    // Deposit some funds to L2 in order to be able to perform L2 transactions.
    const depositHandle = await contractDeployer.zkWallet.deposit({
        to: contractDeployer.zkWallet.address,
        token: zk.utils.ETH_ADDRESS,
        amount: ethers.utils.parseEther('0.001'),
    });
    await depositHandle.wait();

    const greeterContract = await contractDeployer.deploy(greeterArtifact, ['Hi there!']);

    console.log(`Greeter was deployed to ${greeterContract.address}`);

    // The two owners of the multisig
    const owner1 = zk.Wallet.createRandom();
    const owner2 = zk.Wallet.createRandom();

    const aa = await aaDeployer.deploy(aaArtifact, [owner1.address, owner2.address], undefined, []);

    const multisigAddress = aa.address;

    console.log(`Multisig was deployed to ${multisigAddress}`);

    await (
        await contractDeployer.zkWallet.sendTransaction({
            to: multisigAddress,
            // You can increase the amount of ETH sent to the multisig
            value: ethers.utils.parseEther('0.003'),
        })
    ).wait();

    const newGreeting = 'Hello!';
    let aaTx = await greeterContract.populateTransaction.setGreeting(newGreeting);

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
            ergsPerPubdata: zk.utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
        } as zk.types.Eip712Meta,
        value: ethers.BigNumber.from(0),
    };
    const signedTxHash = zk.EIP712Signer.getSignedDigest(aaTx);

    const signature = ethers.utils.concat([
        // Note, that `signMessage` wouldn't work here, since we don't want
        // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
        ethers.utils.joinSignature(owner1._signingKey().signDigest(signedTxHash)),
        ethers.utils.joinSignature(owner2._signingKey().signDigest(signedTxHash)),
    ]);

    aaTx.customData = {
        ...aaTx.customData,
        customSignature: signature,
    };

    console.log(`The multisig's nonce before the first tx is ${await provider.getTransactionCount(multisigAddress)}`);
    const sentTx = await provider.sendTransaction(zk.utils.serialize(aaTx));
    await sentTx.wait();

    // Checking that the nonce for the account has increased.
    console.log(`The multisig's nonce after the first tx is ${await provider.getTransactionCount(multisigAddress)}`);

    // Confirm that tx was successful.
    const greetingFromContract = await greeterContract.greet();
    if (greetingFromContract === newGreeting) {
        console.log('Successfully initiated tx from deployed multisig!');
    } else {
        throw new Error(`Contract said something unexpected: ${greetingFromContract}`);
    }
}
