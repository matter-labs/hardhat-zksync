import 'hardhat/types/config';
import { ZkSyncAnvilConfig } from './types';

declare module 'hardhat/types/config' {
    interface HardhatUserConfig {
        zksyncAnvil?: Partial<ZkSyncAnvilConfig>;
    }

    interface HardhatConfig {
        zksyncAnvil: ZkSyncAnvilConfig;
    }
    interface HardhatNetworkUserConfig {
        zksync?: boolean;
        ethNetwork?: string;
    }

    interface HttpNetworkUserConfig {
        zksync?: boolean;
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
        url: string;
    }

    interface HttpNetworkConfig {
        zksync: boolean;
        ethNetwork?: string;
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        zksync: boolean;
    }
}
