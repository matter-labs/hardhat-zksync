import * as zk from 'zksync-ethers';

import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';
import { ethers } from 'ethers';
import type { EthNetwork, HardhatZksyncEthersHelpers } from './types';
import 'hardhat/types/runtime';

declare module 'hardhat/types/config' {
    interface HttpNetworkUserConfig {
        zksync?: boolean;
        ethNetwork?: EthNetwork;
    }

    interface HttpNetworkConfig {
        zksync: boolean;
        ethNetwork?: EthNetwork;
    }

    interface HardhatNetworkUserConfig {
        zksync?: boolean;
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        zksync: boolean;
    }

    interface HardhatRuntimeEnvironment {
        ethers: (typeof zk & typeof ethers) & (HardhatZksyncEthersHelpers & HardhatEthersHelpers);
        zksyncEthers: typeof zk & HardhatZksyncEthersHelpers;
    }
}
