import { Provider, Signer, Wallet } from 'zksync-ethers';
import { TransactionRequest, TransactionResponse } from 'zksync-ethers/build/types';
import { isAddressEq } from 'zksync-ethers/build/utils';
import { ethers } from 'ethers';
import { findWalletFromAddress } from './utils';
import { HardhatZksyncEthersProvider } from './hardhat-zksync-provider';

export class HardhatZksyncSigner extends Signer {
    private accountWallet?: Wallet;

    public static from(
        signer: ethers.providers.JsonRpcSigner & { provider: HardhatZksyncEthersProvider },
        zksyncProvider?: Provider | HardhatZksyncEthersProvider,
    ): HardhatZksyncSigner {
        const newSigner: Signer = super.from(signer, zksyncProvider);
        const hardhatZksyncSigner: HardhatZksyncSigner = Object.setPrototypeOf(
            newSigner,
            HardhatZksyncSigner.prototype,
        );
        return hardhatZksyncSigner;
    }

    public async sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
        if (!this.accountWallet) {
            this.accountWallet = await findWalletFromAddress(
                this._address,
                (this.provider as HardhatZksyncEthersProvider).hre,
            );
        }

        const address = await this.getAddress();
        const from = !transaction.from ? address : ethers.utils.getAddress(transaction.from);

        if (!isAddressEq(from, address)) {
            throw new Error('Transaction `from` address mismatch!');
        }

        transaction.from = from;

        if (!this.accountWallet) {
            throw new Error(`Account ${from} is not managed by the node you are connected to.`);
        }

        return this.accountWallet.sendTransaction(transaction);
    }
}
