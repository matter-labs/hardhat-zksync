import * as zk2 from 'zksync2-js';
import type { HardhatZksync2jsHelpers } from './types';

import 'hardhat/types/runtime';

declare module 'hardhat/types/runtime' {
    interface HardhatRuntimeEnvironment {
        zksync2js: typeof zk2 & HardhatZksync2jsHelpers;
    }
}
