import 'hardhat/types/config';
import '@matterlabs/hardhat-zksync-solc/dist/src/type-extensions';

import { DeployerAccount, EthNetwork } from './types';
import { Deployer } from './deployer';

declare module 'hardhat/types/config' {
    interface HardhatUserConfig {
        deployerAccounts?: Partial<DeployerAccount>;
    }

    interface HardhatConfig {
        deployerAccounts: DeployerAccount;
    }

    interface HttpNetworkUserConfig {
        zksync?: boolean;
        ethNetwork?: EthNetwork;
        deployPaths?: string | string[];
    }

    interface HttpNetworkConfig {
        zksync: boolean;
        ethNetwork?: EthNetwork;
        deployPaths?: string | string[];
    }

    interface HardhatNetworkUserConfig {
        zksync?: boolean;
        deployPaths?: string | string[];
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
        deployPaths?: string | string[];
    }

    interface ProjectPathsUserConfig {
        deployPaths?: string | string[];
    }

    interface ProjectPathsConfig {
        deployPaths: string | string[];
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        zksync: boolean;
        deployPaths: string[];
    }

    interface HardhatRuntimeEnvironment {
        deployer: Deployer;
    }
}
