import 'hardhat/types/config';

import { ZkSolcConfig } from './types';

declare module 'hardhat/types/config' {
    interface HardhatUserConfig {
        zksolc?: Partial<ZkSolcConfig>;
    }

    interface HardhatConfig {
        zksolc: ZkSolcConfig;
    }

    interface HardhatNetworkUserConfig {
        zksync?: boolean;
    }

    interface HttpNetworkUserConfig {
        zksync?: boolean;
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
