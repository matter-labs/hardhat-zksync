import 'hardhat/types/config';

import { ZkDeployConfig } from './types';

declare module 'hardhat/types/config' {
    interface HardhatUserConfig {
        zkSyncDeploy?: Partial<ZkDeployConfig>;
    }

    interface HardhatConfig {
        zkSyncDeploy: ZkDeployConfig;
    }
}
