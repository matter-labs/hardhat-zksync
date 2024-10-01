import { Provider, Signer, Wallet } from 'zksync-ethers';
import { TransactionLike, TransactionRequest, TransactionResponse } from 'zksync-ethers/build/types';
import { EIP712_TX_TYPE, isAddressEq, serializeEip712 } from 'zksync-ethers/build/utils';
import { copyRequest, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { findWalletFromAddress, isImpersonatedSigner } from '../utils';
import { richWallets } from '../rich-wallets';
import { LOCAL_CHAIN_IDS_ENUM } from '../constants';
import { HardhatZksyncEIP712Signer } from './hardhat-zksync-eip712-signer';

export class HardhatZksyncSigner extends Signer {
    private accountWallet: Wallet | HardhatZksyncEIP712Signer | undefined;

    private constructor(provider: Provider, address: string, accountWallet?: Wallet | HardhatZksyncEIP712Signer) {
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

        if (this.accountWallet instanceof HardhatZksyncEIP712Signer) {
            return this._sendTransaction(transaction);
        }

        return this.accountWallet.sendTransaction(transaction);
    }

    public async signMessage(message: string | Uint8Array): Promise<string> {
        if (!this.accountWallet) {
            throw new Error(`Account ${await this.getAddress()} is not managed by the node you are connected to.`);
        }

        return this.accountWallet.signMessage(message);
    }

    public async signTypedData(
        domain: ethers.TypedDataDomain,
        types: Record<string, ethers.TypedDataField[]>,
        value: Record<string, any>,
    ): Promise<string> {
        if (!this.accountWallet) {
            throw new Error(`Account ${await this.getAddress()} is not managed by the node you are connected to.`);
        }

        return this.accountWallet.signTypedData(domain, types, value);
    }

    public async signTransaction(transaction: TransactionRequest): Promise<string> {
        if (!this.accountWallet) {
            throw new Error(`Account ${await this.getAddress()} is not managed by the node you are connected to.`);
        }

        const tx = await this._prepareTransaction(transaction);
        return this.accountWallet.signTransaction(tx);
    }

    private async _prepareTransaction(transaction: TransactionRequest): Promise<TransactionLike> {
        const tx = await this.populateFeeData(transaction);

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

            return zkTx;
        }

        return await super.populateTransaction(tx);
    }

    protected async populateFeeData(transaction: TransactionRequest): Promise<ethers.PreparedTransactionRequest> {
        const tx = copyRequest(transaction);

        if (tx.gasPrice && (tx.maxFeePerGas || tx.maxPriorityFeePerGas)) {
            throw new Error(
                'Provide combination of maxFeePerGas and maxPriorityFeePerGas or provide gasPrice. Not both!',
            );
        }
        if (!this.providerL2) {
            throw new Error('Initialize provider L2');
        }
        if (!tx.gasLimit || (!tx.gasPrice && (!tx.maxFeePerGas || !tx.maxPriorityFeePerGas))) {
            const fee = await this.providerL2!.estimateFee(tx);
            tx.gasLimit ??= fee.gasLimit;
            if (!tx.gasPrice && tx.type === 0) {
                tx.gasPrice = fee.maxFeePerGas;
            } else if (!tx.gasPrice && tx.type !== 0) {
                tx.maxFeePerGas ??= fee.maxFeePerGas;
                tx.maxPriorityFeePerGas ??= fee.maxPriorityFeePerGas;
            }
        }
        return tx;
    }
    private async _sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
        if (
            transaction.type === null ||
            transaction.type === undefined ||
            transaction.type === EIP712_TX_TYPE ||
            transaction.customData
        ) {
            const zkTx = await this._prepareTransaction(transaction);
            zkTx.customData = zkTx.customData ?? {};
            zkTx.customData.customSignature = await this.accountWallet!.signTransaction(zkTx);

            const txBytes = serializeEip712(zkTx);
            return await this.provider.broadcastTransaction(txBytes);
        }
        return (await super.sendTransaction(transaction)) as TransactionResponse;
    }

    private static async _getProperSigner(
        hre: HardhatRuntimeEnvironment,
        address: string,
    ): Promise<Wallet | HardhatZksyncEIP712Signer | undefined> {
        let signer: Wallet | HardhatZksyncEIP712Signer | undefined = await findWalletFromAddress(hre, address);
        if (!signer && (await isImpersonatedSigner(hre.ethers.provider, address))) {
            signer = new HardhatZksyncEIP712Signer(
                new Wallet(
                    richWallets[LOCAL_CHAIN_IDS_ENUM.ERA_NODE][0].privateKey,
                    hre.ethers.provider,
                    hre.ethers.providerL1,
                ),
                hre.ethers.provider.getNetwork().then((n) => Number(n.chainId)),
            );
        }

        return signer;
    }
}
