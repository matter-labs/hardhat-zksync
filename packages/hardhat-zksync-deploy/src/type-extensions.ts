import 'hardhat/types/config';

import { EthNetwork } from './types';

declare module 'hardhat/types/config' {
    interface HardhatNetworkUserConfig {
        zksync: boolean;
        ethNetwork?: EthNetwork;
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
        ethNetwork: EthNetwork;
    }

    interface HttpNetworkUserConfig {
        zksync?: boolean;
        ethNetwork?: EthNetwork;
    }

    interface HttpNetworkConfig {
        zksync: boolean;
        ethNetwork: EthNetwork;
    }
}
