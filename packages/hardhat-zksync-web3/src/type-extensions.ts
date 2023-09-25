import * as zk from 'zksync-web3';
import type { HardhatZkSyncWeb3Helpers } from "./types"

import "hardhat/types/runtime"

declare module 'hardhat/types/runtime' {
    interface HardhatRuntimeEnvironment {
        zkSyncWeb3: typeof zk & HardhatZkSyncWeb3Helpers;
      }
}