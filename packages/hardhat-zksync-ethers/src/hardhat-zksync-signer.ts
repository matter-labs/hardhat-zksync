import { Provider, Signer, Wallet } from 'zksync-ethers';
import { TransactionRequest, TransactionResponse } from 'zksync-ethers/build/types';
import { isAddressEq } from 'zksync-ethers/build/utils';
import { ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { findWalletFromAddress } from './utils';

export class HardhatZksyncSigner extends Signer {
    private accountWallet?: Wallet;

    private constructor(provider: Provider, address: string, accountWallet?: Wallet) {
        super(provider, address);
        this.accountWallet = accountWallet;
    }

    public static async create(
        hre: HardhatRuntimeEnvironment,
        provider: Provider,
        address: string,
    ): Promise<HardhatZksyncSigner> {
        const wallet = await findWalletFromAddress(hre, address);
        const signer = new HardhatZksyncSigner(provider, address, wallet);
        return signer;
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

        return this.accountWallet.sendTransaction(transaction);
    }
}
