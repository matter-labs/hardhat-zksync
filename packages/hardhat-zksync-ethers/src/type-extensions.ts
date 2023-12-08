import * as zk from 'zksync2-js';
import type { HardhatZksyncEthersHelpers } from './types';

import 'hardhat/types/runtime';

declare module 'hardhat/types/runtime' {
    interface HardhatRuntimeEnvironment {
        zksyncEthers: typeof zk & HardhatZksyncEthersHelpers;
    }
}
