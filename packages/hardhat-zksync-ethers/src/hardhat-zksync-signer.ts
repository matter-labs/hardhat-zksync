import { EIP712Signer, Provider, Signer, Wallet } from 'zksync-ethers';
import { TransactionLike, TransactionRequest, TransactionResponse } from 'zksync-ethers/build/types';
import { EIP712_TX_TYPE, isAddressEq, serializeEip712 } from 'zksync-ethers/build/utils';
import { ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { findWalletFromAddress, isImpersonatedSigner } from './utils';
import { richWallets } from './rich-wallets';
import { LOCAL_CHAIN_IDS_ENUM } from './constants';

export class HardhatZksyncSigner extends Signer {
    private accountWallet: Wallet | EIP712Signer | undefined;

    private constructor(provider: Provider, address: string, accountWallet?: Wallet | EIP712Signer) {
        super(provider, address);
        this.providerL2 = provider;
        this.accountWallet = accountWallet;
    }

    public static async create(
        hre: HardhatRuntimeEnvironment,
        provider: Provider,
        address: string,
    ): Promise<HardhatZksyncSigner> {
        return new HardhatZksyncSigner(provider, address, await this._getProperSigner(hre, address));
    }

    public async sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
        const address = await this.getAddress();
        const from = !transaction.from ? address : await ethers.resolveAddress(transaction.from);

        if (!isAddressEq(from, address)) {
            throw new Error('Transaction `from` address mismatch!');
        }

        transaction.from = from;

        if (!this.accountWallet) {
            throw new Error(`Account ${from} is not managed by the node you are connected to.`);
        }

        if (this.accountWallet instanceof EIP712Signer) {
            return this._sendTransaction(transaction);
        }

        return this.accountWallet.sendTransaction(transaction);
    }

    private async _sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
        const tx = await super.populateFeeData(transaction);

        if (tx.type === null || tx.type === undefined || tx.type === EIP712_TX_TYPE || tx.customData) {
            const address = await this.getAddress();
            tx.from ??= address;
            if (!isAddressEq(await ethers.resolveAddress(tx.from), address)) {
                throw new Error('Transaction `from` address mismatch!');
            }
            const zkTx: TransactionLike = {
                type: tx.type ?? EIP712_TX_TYPE,
                value: tx.value ?? 0,
                data: tx.data ?? '0x',
                nonce: tx.nonce ?? (await this.getNonce()),
                maxFeePerGas: tx.gasPrice ?? tx.maxFeePerGas,
                maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
                gasLimit: tx.gasLimit,
                chainId: tx.chainId ?? (await this.provider.getNetwork()).chainId,
                to: await ethers.resolveAddress(tx.to!),
                customData: this._fillCustomData(tx.customData ?? {}),
                from: address,
            };
            zkTx.customData ??= {};
            zkTx.customData.customSignature = await (this.accountWallet as EIP712Signer).sign(zkTx);

            const txBytes = serializeEip712(zkTx);
            return await this.provider.broadcastTransaction(txBytes);
        }
        return (await super.sendTransaction(tx)) as TransactionResponse;
    }

    private static async _getProperSigner(
        hre: HardhatRuntimeEnvironment,
        address: string,
    ): Promise<Wallet | EIP712Signer | undefined> {
        let signer: Wallet | EIP712Signer | undefined = await findWalletFromAddress(hre, address);
        if (!signer && (await isImpersonatedSigner(hre.ethers.provider, address))) {
            signer = new EIP712Signer(
                new Wallet(richWallets[LOCAL_CHAIN_IDS_ENUM.ERA_NODE][0].privateKey),
                hre.ethers.provider.getNetwork().then((n) => Number(n.chainId)),
            );
        }

        return signer;
    }
}
