import * as zk from 'zksync-ethers';
import type { EthNetwork, HardhatZksyncEthersHelpers } from './types';
import '@matterlabs/hardhat-zksync-solc/dist/src/type-extensions';

import 'hardhat/types/runtime';

declare module 'hardhat/types/config' {
    interface HttpNetworkUserConfig {
        ethNetwork?: EthNetwork;
    }

    interface HttpNetworkConfig {
        ethNetwork?: EthNetwork;
    }
}

declare module 'hardhat/types/runtime' {
    interface HardhatRuntimeEnvironment {
        zksyncEthers: typeof zk & HardhatZksyncEthersHelpers;
    }
}
