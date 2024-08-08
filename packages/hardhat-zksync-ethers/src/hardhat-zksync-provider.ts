import { ethers, getAddress, Networkish, resolveProperties } from 'ethers';
import { Provider } from 'zksync-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HardhatZksyncSigner } from './hardhat-zksync-signer';
import { getEthAccounts } from './utils';

export class HardhatZksyncEthersProvider extends Provider {
    constructor(
        private _hre: HardhatRuntimeEnvironment,
        url?: ethers.FetchRequest | string,
        network?: Networkish,
        options?: any,
    ) {
        super(url, network, options);
    }

    public async getSigner(address?: string | number | undefined): Promise<HardhatZksyncSigner> {
        if (address === null || address === undefined) {
            address = 0;
        }

        const accountsPromise = getEthAccounts(this._hre);

        if (typeof address === 'number') {
            const allAccounts = (await accountsPromise) as string[];
            if (address >= allAccounts.length) {
                throw new Error(`Account at index ${address} is not managed by the node you are connected to.`);
            }
            return await HardhatZksyncSigner.create(this._hre, this, allAccounts[address]);
        }

        const { accounts } = await resolveProperties({
            network: this.getNetwork(),
            accounts: accountsPromise,
        });

        address = getAddress(address);
        for (const account of accounts) {
            if (getAddress(account) === address) {
                return await HardhatZksyncSigner.create(this._hre, this, address);
            }
        }

        throw new Error(`Account ${address} is not managed by the node you are connected to.`);
    }
}
