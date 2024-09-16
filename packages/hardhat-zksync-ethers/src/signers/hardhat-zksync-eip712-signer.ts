import { ethers } from 'ethers';
import { EIP712Signer, Wallet } from 'zksync-ethers';
import { TransactionLike } from 'zksync-ethers/build/types';
import { serializeEip712 } from 'zksync-ethers/build/utils';

export class HardhatZksyncEIP712Signer extends EIP712Signer {
    private readonly accountWallet: Wallet;

    constructor(wallet: Wallet, chainId: number | Promise<number>) {
        super(wallet, chainId);
        this.accountWallet = wallet;
    }

    public async signMessage(message: string | Uint8Array): Promise<string> {
        return this.accountWallet.signMessage(message);
    }

    public async signTransaction(_transaction: TransactionLike): Promise<string> {
        _transaction.customData = _transaction.customData || {};
        _transaction.customData.customSignature = await this.sign(_transaction);

        return serializeEip712(_transaction);
    }

    public async signTypedData(
        _domain: ethers.TypedDataDomain,
        _types: Record<string, ethers.TypedDataField[]>,
        _value: Record<string, any>,
    ): Promise<string> {
        return this.accountWallet.signTypedData(_domain, _types, _value);
    }
}
