import { ethers } from 'ethers';
import { Provider } from 'zksync-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ConnectionInfo } from 'ethers/lib/utils';
import { HardhatZksyncSigner } from './signers/hardhat-zksync-signer';

export class HardhatZksyncEthersProvider extends Provider {
    constructor(
        public readonly hre: HardhatRuntimeEnvironment,
        url?: ConnectionInfo | string,
        network?: ethers.providers.Networkish,
    ) {
        if (!url) {
            url = 'http://localhost:3050';
        }

        super(url, network);
    }

    public getSigner(address?: string | number | undefined): HardhatZksyncSigner {
        return HardhatZksyncSigner.from(super.getSigner(address) as any, this);
    }
}
