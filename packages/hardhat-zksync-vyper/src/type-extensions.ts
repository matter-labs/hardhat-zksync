import 'hardhat/types/config';

import { ZkVyperConfig } from './types';

declare module 'hardhat/types/config' {
    interface HardhatUserConfig {
        zkvyper?: Partial<ZkVyperConfig>;
    }

    interface HardhatConfig {
        zkvyper: ZkVyperConfig;
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
        solcCompilationsNum: number;
    }
}
