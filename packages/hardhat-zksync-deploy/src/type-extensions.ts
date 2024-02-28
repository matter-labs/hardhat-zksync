import 'hardhat/types/config';
import '@matterlabs/hardhat-zksync-solc/dist/src/type-extensions';

import { DeployerAccount, EthNetwork } from './types';
import { DeployerExtension } from './deployer-extension';

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
        forceDeploy?: boolean;
    }

    interface HttpNetworkConfig {
        zksync: boolean;
        ethNetwork?: EthNetwork;
        deployPaths?: string | string[];
        forceDeploy?: boolean;
    }

    interface HardhatNetworkUserConfig {
        zksync?: boolean;
        deployPaths?: string | string[];
        forceDeploy?: boolean;
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
        deployPaths?: string | string[];
        forceDeploy?: boolean;
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
        forceDeploy: boolean;
    }

    interface HardhatRuntimeEnvironment {
        deployer: DeployerExtension;
    }
}
