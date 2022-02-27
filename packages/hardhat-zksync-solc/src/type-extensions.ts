import 'hardhat/types/config';

import { ZkSolcConfig } from './types';

declare module 'hardhat/types/config' {
    interface HardhatUserConfig {
        zksync?: Partial<ZkSolcConfig>;
    }

    interface HardhatConfig {
        zksync?: ZkSolcConfig;
    }

    interface HardhatNetworkUserConfig {
        zksync?: boolean;
    }

    interface HttpNetworkUserConfig {
        zksync: boolean;
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
    }

    interface HttpNetworkConfig {
        zksync: boolean;
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        zksync: boolean;
    }
}