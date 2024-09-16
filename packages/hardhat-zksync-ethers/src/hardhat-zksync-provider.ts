import { ethers, getAddress, Networkish, resolveProperties } from 'ethers';
import { Provider } from 'zksync-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HardhatZksyncSigner } from './signers/hardhat-zksync-signer';
import { getSignerAccounts } from './utils';

export class HardhatZksyncEthersProvider extends Provider {
    constructor(
        private _hre: HardhatRuntimeEnvironment,
        url?: ethers.FetchRequest | string,
        network?: Networkish,
        options?: any,
    ) {
        if (!url) {
            url = 'http://localhost:3050';
        }

        // Disable cache for local networ, other checks(localhost and 127.0.0.1) will be provided in the super constructor
        const isLocalNetwork = typeof url === 'string' ? url.includes('0.0.0.0') : url.url.includes('0.0.0.0');

        const optionsWithDisabledCache = isLocalNetwork ? { ...options, cacheTimeout: -1 } : options;

        super(url, network, optionsWithDisabledCache);
    }

    public async getSigner(address?: string | number | undefined): Promise<HardhatZksyncSigner> {
        if (address === null || address === undefined) {
            address = 0;
        }

        const accountsPromise = getSignerAccounts(this._hre);

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
