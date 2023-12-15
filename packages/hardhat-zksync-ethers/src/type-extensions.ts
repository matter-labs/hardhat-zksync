import * as zk from 'zksync-ethers';
import type { HardhatZksyncEthersHelpers } from './types';

import 'hardhat/types/runtime';

declare module 'hardhat/types/runtime' {
    interface HardhatRuntimeEnvironment {
        zksyncEthers: typeof zk & HardhatZksyncEthersHelpers;
    }
}
