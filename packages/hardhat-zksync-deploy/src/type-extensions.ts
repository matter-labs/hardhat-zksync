import 'hardhat/types/config';
import '@poohnet/hardhat-zksync-solc/dist/src/type-extensions';

import { EthNetwork } from './types';

declare module 'hardhat/types/config' {
    interface HttpNetworkUserConfig {
        zksync?: boolean;
        ethNetwork?: EthNetwork;
    }

    interface HttpNetworkConfig {
        zksync: boolean;
        ethNetwork?: EthNetwork;
    }

    interface HardhatNetworkUserConfig {
        zksync?: boolean;
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        zksync: boolean;
    }
}
